import AvatarDisplay from "@/components/AvatarDisplay";
import { CONFETTI_DOTS, ConfettiDot } from "@/components/ConfettiDot";
import { NavigationButton } from "@/components/NavigationButton";
import VoteBar from "@/components/VoteBar";
import { createTiebreaker } from "@/hooks/create-tiebreaker";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            .select("id, proposal_id, participant_id, vote_type, created_at")
            .in("proposal_id", proposalIds)
            .eq("vote_type", "yes"); // Only fetch yes votes
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
  }, [roomId, profile?.id]);

  const voteCounts = useMemo(() => {
    const map: Record<string, number> = {};
    votes.forEach((v: any) => {
      // Only count votes where vote_type is 'yes' (or no vote_type for backwards compat)
      if (v.vote_type === "yes" || !v.vote_type) {
        map[v.proposal_id] = (map[v.proposal_id] || 0) + 1;
      }
    });
    return map;
  }, [votes]);

  const totalVotes = votes.filter(
    (v: any) => v.vote_type === "yes" || !v.vote_type,
  ).length;

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
    // vigtig: hvis tiebreak har sat winner_proposal_id, brug den først
    if (room?.winner_proposal_id) {
      return proposals.find((p) => p.id === room.winner_proposal_id) ?? null;
    }

    // ellers normal entydig vinder uden tiebreak
    if (tiedProposals.length === 1) return tiedProposals[0];

    return null;
  }, [room?.winner_proposal_id, proposals, tiedProposals]);

  const isHost = room?.host_id === profile?.id;
  const tieExists = tiedProposals.length >= 2 && maxVotes >= 1;

  const handleStartTiebreaker = async () => {
    if (!roomId || !tieExists) return;

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getUser();
      if (sessionError) {
        console.error("Failed to get user session:", sessionError);
        return;
      }
      const userId = (sessionData as any)?.user?.id;

      if (!userId) {
        console.error("Not authenticated - cannot create tiebreaker");
        return;
      }
      if (userId !== room?.host_id) {
        console.error("Current user is not host - RLS will reject insert");
        return;
      }

      // prepare tied participants...
      const tiedParticipants = tiedProposals.map((p) => {
        const part = participants.find((pt: any) => pt.id === p.participant_id);
        return { participant_id: part?.id, proposal_id: p.id };
      });

      const missing = tiedParticipants.some((t) => !t.participant_id);
      if (missing) {
        console.error("Missing participant ids for tied proposals");
        return;
      }

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

  useEffect(() => {
    if (!roomId || !winner || tiedProposals.length !== 1) return; // only set if single winner, not tie

    const setWinnerInDB = async () => {
      try {
        const { error } = await supabase
          .from("rooms")
          .update({ winner_proposal_id: winner.id })
          .eq("id", roomId);

        if (error) {
          console.error("Failed to set winner in DB:", error);
        }
      } catch (e) {
        console.error("Error setting winner:", e);
      }
    };

    setWinnerInDB();
  }, [roomId, winner, tiedProposals.length]);

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
                    Share result
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
