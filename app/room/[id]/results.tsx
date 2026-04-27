// filepath: app/room/[id]/results.tsx
import { NavigationButton } from "@/components/NavigationButton";
import { createTiebreaker } from "@/hooks/create-tiebreaker";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Simple emoji map for proposals — extend as needed
const EMOJI_LIST = ["🍕", "🍣", "🌮", "🍔", "🍜", "🥗", "🍱", "🌯"];

function getEmoji(index: number) {
  return EMOJI_LIST[index % EMOJI_LIST.length];
}

// Confetti dot component
function ConfettiDot({ color, style }: { color: string; style?: object }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
          transform: [{ rotate: "30deg" }],
        },
        style,
      ]}
    />
  );
}

const CONFETTI_DOTS = [
  { color: "#FF6B6B", top: 10, left: 30 },
  { color: "#4CAF50", top: 20, left: 90 },
  { color: "#FF9800", top: 8, left: 160 },
  { color: "#9C27B0", top: 25, left: 220 },
  { color: "#2196F3", top: 12, left: 280 },
  { color: "#FF6B6B", top: 30, right: 60 },
  { color: "#4CAF50", top: 15, right: 20 },
  { color: "#FF9800", top: 5, right: 110 },
];

// Animated vote bar
function VoteBar({
  count,
  max,
  isWinner,
}: {
  count: number;
  max: number;
  isWinner: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? count / max : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: isWinner ? "#8B5CF6" : "#4B5563",
          width: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}

// get initials helper (same as voting.tsx)
function getInitials(username: string | undefined): string {
  if (!username) return "?";
  return username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// AvatarDisplay copied from voting.tsx (renders avatar or initials in colored circle)
function AvatarDisplay({
  avatar_url,
  username,
  color,
  size = 40,
}: {
  avatar_url?: string | null;
  username?: string | undefined;
  color?: string | null | undefined;
  size?: number;
}) {
  if (avatar_url) {
    return (
      <Image
        source={{ uri: avatar_url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color ?? "#7b2fff",
      }}
    >
      <Text className="text-xs font-bold text-white">
        {getInitials(username)}
      </Text>
    </View>
  );
}

export default function Results() {
  const { id: roomId } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuthContext();
  const [room, setRoom] = useState<any | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiebreakInProgress, setTiebreakInProgress] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const { data: roomData } = await supabase
          .from("rooms")
          .select("id, title, code, host_id, winner_proposal_id")
          .eq("id", roomId)
          .maybeSingle();
        setRoom(roomData || null);

        const { data: proposalsData } = await supabase
          .from("proposals")
          .select("id, room_id, participant_id, content, created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });
        setProposals(proposalsData || []);

        let votesData: any[] = [];
        const proposalIds = (proposalsData || []).map((p: any) => p.id);
        if (proposalIds.length > 0) {
          const { data: v } = await supabase
            .from("votes")
            .select("id, proposal_id, participant_id, created_at")
            .in("proposal_id", proposalIds);
          votesData = v || [];
        }
        setVotes(votesData);

        const { data: participantsData } = await supabase
          .from("participants")
          .select("id, room_id, user_id, joined_at")
          .eq("room_id", roomId);
        // Fetch profiles for participants and merge
        const participantsArr = participantsData || [];
        const userIds = Array.from(
          new Set(participantsArr.map((p: any) => p.user_id)),
        );
        let profilesData: any[] = [];
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, color")
            .in("id", userIds);
          profilesData = profs || [];
        }
        const enrichedParticipants = participantsArr.map((p: any) => ({
          ...p,
          profile: profilesData.find((pf) => pf.id === p.user_id) ?? null,
        }));
        setParticipants(enrichedParticipants);
      } catch (e) {
        console.error("Results fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    const channel = supabase
      .channel(`tiebreakers:room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tiebreakers",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const tiebreakerId = payload.new.id;
          const { data: myParticipantRow } = await supabase
            .from("participants")
            .select("id")
            .eq("room_id", roomId)
            .eq("user_id", profile?.id)
            .maybeSingle();

          if (!myParticipantRow) {
            setTiebreakInProgress(true);
            return;
          }

          const { data: membership } = await supabase
            .from("tiebreaker_participants")
            .select("participant_id")
            .eq("tiebreaker_id", tiebreakerId)
            .eq("participant_id", myParticipantRow.id)
            .maybeSingle();

          if (membership) {
            router.push({
              pathname: "/room/[id]/tiebreak",
              params: { id: roomId, tiebreakerId },
            });
          } else {
            setTiebreakInProgress(true);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, profile?.id]);

  const voteCounts = useMemo(() => {
    const map: Record<string, number> = {};
    votes.forEach((v: any) => {
      map[v.proposal_id] = (map[v.proposal_id] || 0) + 1;
    });
    return map;
  }, [votes]);

  const totalVotes = votes.length;

  const sortedProposals = useMemo(() => {
    return [...proposals].sort(
      (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0),
    );
  }, [proposals, voteCounts]);

  const maxVotes = useMemo(() => {
    if (proposals.length === 0) return 0;
    return Math.max(...proposals.map((p) => voteCounts[p.id] || 0));
  }, [proposals, voteCounts]);

  const tiedProposals = useMemo(() => {
    if (maxVotes <= 0) return [];
    return proposals.filter((p) => (voteCounts[p.id] || 0) === maxVotes);
  }, [proposals, voteCounts, maxVotes]);

  const winner = useMemo(() => {
    if (tiedProposals.length === 1) return tiedProposals[0];
    if (room?.winner_proposal_id) {
      return proposals.find((p) => p.id === room.winner_proposal_id) ?? null;
    }
    return null;
  }, [tiedProposals, room, proposals]);

  const isHost = room?.host_id === profile?.id;
  const tieExists = tiedProposals.length >= 2 && maxVotes >= 1;

  const handleStartTiebreaker = async () => {
    if (!roomId || !isHost || !tieExists) return;
    try {
      const tiedParticipants = tiedProposals.map((p) => {
        const part = participants.find((pt: any) => pt.id === p.participant_id);
        return { participant_id: part?.id, proposal_id: p.id };
      });
      const missing = tiedParticipants.some((t) => !t.participant_id);
      if (missing) return;

      const t = await createTiebreaker(
        roomId as string,
        tiedParticipants as any[],
      );
      router.push({
        pathname: "/room/[id]/tiebreak",
        params: { id: roomId, tiebreakerId: t.id },
      });
    } catch (e) {
      console.error("Failed to start tiebreaker:", e);
    }
  };

  const handleShare = async () => {
    if (!winner) return;
    await Share.share({
      message: `We picked "${winner.content}" in ${room?.title ?? "our room"}! 🎉`,
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-black">
        <ActivityIndicator color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        data={sortedProposals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}
        ListHeaderComponent={
          <>
            {/* Confetti header */}
            <View className="items-center mt-2 mb-1" style={{ height: 50 }}>
              {CONFETTI_DOTS.map((d, i) => (
                <ConfettiDot key={i} color={d.color} style={d as object} />
              ))}
              <Text className="z-10 text-xl font-bold text-white">Results</Text>
              <Text className="z-10 text-sm text-gray-400">
                {room?.title ?? "Room"} · {totalVotes} votes
              </Text>
            </View>

            {/* Winner card */}
            {winner && (
              <View
                className="items-center p-5 mt-4 mb-6 rounded-3xl"
                style={{
                  backgroundColor: "#1A0D2E",
                  borderWidth: 1.5,
                  borderColor: "#7C3AED",
                  shadowColor: "#7C3AED",
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text className="mb-2 text-3xl">👑</Text>
                <View
                  className="px-4 py-1 mb-3 rounded-full"
                  style={{ backgroundColor: "#3B1F6A" }}
                >
                  <Text className="text-xs font-semibold tracking-widest text-white uppercase">
                    Winner
                  </Text>
                </View>
                <View className="items-center mb-2">
                  {/* avatar of proposer */}
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <AvatarDisplay
                      avatar_url={(() => {
                        const part = participants.find(
                          (pt) => pt.id === winner.participant_id,
                        );
                        return part?.profile?.avatar_url;
                      })()}
                      username={(() => {
                        const part = participants.find(
                          (pt) => pt.id === winner.participant_id,
                        );
                        return part?.profile?.username;
                      })()}
                      color={(() => {
                        const part = participants.find(
                          (pt) => pt.id === winner.participant_id,
                        );
                        return part?.profile?.color;
                      })()}
                      size={64}
                    />
                  </View>
                  <Text className="mb-1 text-2xl font-bold text-center text-white">
                    {winner.content}
                  </Text>
                </View>
                <Text className="mt-1 mb-4 text-sm text-gray-400">
                  {voteCounts[winner.id] ?? 0} out of {totalVotes} voted yes
                </Text>
                <Pressable
                  onPress={handleShare}
                  className="px-6 py-2 rounded-full"
                  style={{ backgroundColor: "#3B1F6A" }}
                >
                  <Text className="text-sm font-medium text-white">
                    share result
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Tiebreaker in progress banner */}
            {tiebreakInProgress && (
              <View
                className="p-3 mb-4 rounded-2xl"
                style={{ backgroundColor: "rgba(234,179,8,0.1)" }}
              >
                <Text className="text-sm text-center text-yellow-200">
                  Tiebreaker in progress…
                </Text>
              </View>
            )}

            <Text className="mb-3 text-sm text-gray-500">all suggestions</Text>
          </>
        }
        renderItem={({ item, index }) => {
          const count = voteCounts[item.id] || 0;
          const isTopVote = count === maxVotes && maxVotes > 0;
          return (
            <View className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      overflow: "hidden",
                    }}
                  >
                    <AvatarDisplay
                      avatar_url={(() => {
                        const part = participants.find(
                          (pt) => pt.id === item.participant_id,
                        );
                        return part?.profile?.avatar_url;
                      })()}
                      username={(() => {
                        const part = participants.find(
                          (pt) => pt.id === item.participant_id,
                        );
                        return part?.profile?.username;
                      })()}
                      color={(() => {
                        const part = participants.find(
                          (pt) => pt.id === item.participant_id,
                        );
                        return part?.profile?.color;
                      })()}
                      size={32}
                    />
                  </View>
                  <Text
                    className={`text-base ${
                      isTopVote
                        ? "text-white font-bold"
                        : "text-gray-300 font-normal"
                    }`}
                  >
                    {item.content}
                  </Text>
                </View>
                <Text
                  className={`text-sm ${
                    isTopVote
                      ? "text-purple-400 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {count} {count === 1 ? "vote" : "votes"}
                </Text>
              </View>
              <VoteBar count={count} max={maxVotes} isWinner={isTopVote} />
            </View>
          );
        }}
        ListFooterComponent={
          <View className="mt-6 gap-y-3">
            {/* Tiebreaker section */}
            {tieExists && (
              <View
                className="items-center p-4 mb-1 rounded-2xl"
                style={{
                  backgroundColor: "#111",
                  borderWidth: 1.5,
                  borderColor: "#22C55E",
                  borderStyle: "dashed",
                }}
              >
                <Text className="mb-3 text-sm text-gray-400">
                  Got a tie? Settle it fast.
                </Text>
                {isHost ? (
                  <Pressable
                    onPress={handleStartTiebreaker}
                    className="items-center justify-center w-full h-12 rounded-full"
                    style={{ backgroundColor: "#22C55E" }}
                  >
                    <Text className="text-base font-bold text-white">
                      ⚡ TIEBREAKER
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    className="items-center justify-center w-full h-12 rounded-full"
                    style={{ backgroundColor: "#1A3A25" }}
                  >
                    <Text className="text-sm text-green-300">
                      Waiting for host to start tiebreaker…
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Start new room */}
            <NavigationButton
              href="/roomcreation"
              label="Start new room"
              variant="secondary"
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
