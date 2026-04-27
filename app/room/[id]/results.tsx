// filepath: /Users/mikkelruby/Desktop/Eksamen 2026/Unanimo/app/room/[id]/results.tsx
import { createTiebreaker } from "@/hooks/create-tiebreaker";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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

        // Guard .in() for empty array
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
        setParticipants(participantsData || []);
      } catch (e) {
        console.error("Results fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    // subscribe to tiebreakers for this room to show banner / navigate tied users
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

          // fetch my participant row server-side instead of relying on local `participants` state
          const { data: myParticipantRow } = await supabase
            .from("participants")
            .select("id")
            .eq("room_id", roomId)
            .eq("user_id", profile?.id)
            .maybeSingle();

          if (!myParticipantRow) {
            setTiebreakInProgress(true); // not a participant in this room
            return;
          }

          // check membership of myParticipant in this new tiebreaker
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
  }, [roomId, profile?.id]); // removed participants from deps

  const voteCounts = useMemo(() => {
    const map: Record<string, number> = {};
    votes.forEach((v: any) => {
      map[v.proposal_id] = (map[v.proposal_id] || 0) + 1;
    });
    return map;
  }, [votes]);

  const maxVotes = useMemo(() => {
    if (proposals.length === 0) return 0;
    return Math.max(...proposals.map((p) => voteCounts[p.id] || 0));
  }, [proposals, voteCounts]);

  const tiedProposals = useMemo(() => {
    if (maxVotes <= 0) return [];
    return proposals.filter((p) => (voteCounts[p.id] || 0) === maxVotes);
  }, [proposals, voteCounts, maxVotes]);

  const isHost = room?.host_id === profile?.id;
  const tieExists = tiedProposals.length >= 2 && maxVotes >= 1;

  const handleStartTiebreaker = async () => {
    if (!roomId || !isHost || !tieExists) return;
    try {
      // map proposals -> participant rows
      // need participant ids for each tied proposal
      const tiedParticipants = tiedProposals.map((p) => {
        const part = participants.find((pt: any) => pt.id === p.participant_id);
        return { participant_id: part?.id, proposal_id: p.id };
      });

      // ensure we have participant ids
      const missing = tiedParticipants.some((t) => !t.participant_id);
      if (missing) {
        console.error("Missing participant ids for tied proposals");
        return;
      }

      const t = await createTiebreaker(
        roomId as string,
        tiedParticipants as any[],
      );
      // navigate host into tiebreak screen
      router.push({
        pathname: "/room/[id]/tiebreak",
        params: { id: roomId, tiebreakerId: t.id },
      });
    } catch (e) {
      console.error("Failed to start tiebreaker:", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-black">
        <ActivityIndicator color="#7B2FFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-6 bg-black">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white">
          {room?.title ?? "Room"}
        </Text>
        <Text className="text-sm text-gray-400">Results</Text>
      </View>

      {/* Winner block (if any) */}
      {room?.winner_proposal_id ? (
        <View className="p-4 mb-4 rounded-2xl bg-purple-900/30">
          <Text className="font-semibold text-white">Winner set</Text>
        </View>
      ) : null}

      {/* Tiebreaker banner for non-tied users */}
      {tiebreakInProgress && (
        <View className="p-3 mb-4 rounded-2xl bg-yellow-800/20">
          <Text className="text-sm text-yellow-200">
            Tiebreaker in progress…
          </Text>
        </View>
      )}

      {/* Proposals list */}
      <FlatList
        data={proposals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const count = voteCounts[item.id] || 0;
          const isTied = tiedProposals.some((p) => p.id === item.id);
          return (
            <View
              className={`p-4 mb-3 rounded-2xl ${isTied ? "bg-purple-800/30" : "bg-gray-800/20"}`}
            >
              <Text className="text-white">{item.content}</Text>
              <Text className="mt-2 text-sm text-gray-400">{count} votes</Text>
            </View>
          );
        }}
      />

      {/* Controls */}
      <View className="mt-4 space-y-3">
        {isHost && tieExists ? (
          <Pressable
            onPress={handleStartTiebreaker}
            className="items-center justify-center w-full bg-green-500 rounded-full h-14"
          >
            <Text className="font-bold text-white">TIEBREAKER</Text>
          </Pressable>
        ) : tieExists ? (
          <View className="items-center justify-center w-full bg-gray-700 rounded-full h-14">
            <Text className="text-white">
              Waiting for host to start tiebreaker…
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.replace("/")}
          className="items-center justify-center w-full bg-gray-800 rounded-full h-14"
        >
          <Text className="text-white">Back to home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
