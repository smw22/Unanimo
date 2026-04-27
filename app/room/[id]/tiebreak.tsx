import { NavigationButton } from "@/components/NavigationButton";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Entrant = {
  participant_id: string;
  proposal_id: string;
  label: string; // this will now be proposal.content
};

const WHEEL_SIZE = 320; // bigger wheel

export default function TieBreak() {
  const router = useRouter();
  const { id: roomId, tiebreakerId } = useLocalSearchParams<{
    id?: string;
    tiebreakerId?: string;
  }>();
  const { profile } = useAuthContext();

  const [tiebreaker, setTiebreaker] = useState<any | null>(null);
  const [room, setRoom] = useState<any | null>(null);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const rotation = useRef(new Animated.Value(0)).current;
  const isHost = profile?.id === room?.host_id;

  const rotationDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const segmentAngle = useMemo(
    () => (entrants.length > 0 ? 360 / entrants.length : 360),
    [entrants.length],
  );

  useEffect(() => {
    if (!roomId || !tiebreakerId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let channel: any = null;

    const boot = async () => {
      try {
        const [{ data: tb }, { data: rm }, { data: rows }] = await Promise.all([
          supabase
            .from("tiebreakers")
            .select("*")
            .eq("id", tiebreakerId)
            .maybeSingle(),
          supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
          supabase
            .from("tiebreaker_participants")
            .select("participant_id, proposal_id")
            .eq("tiebreaker_id", tiebreakerId),
        ]);

        if (!mounted) return;

        setTiebreaker(tb ?? null);
        setRoom(rm ?? null);

        const proposalIds = (rows ?? []).map((r: any) => r.proposal_id);

        const { data: proposals } = await supabase
          .from("proposals")
          .select("id, content")
          .in("id", proposalIds);

        const contentById = new Map(
          (proposals ?? []).map((p: any) => [p.id, p.content]),
        );

        const mapped: Entrant[] = (rows ?? []).map((r: any, i: number) => ({
          participant_id: r.participant_id,
          proposal_id: r.proposal_id,
          label: contentById.get(r.proposal_id) ?? `Forslag ${i + 1}`,
        }));

        setEntrants(mapped);
      } catch (e) {
        console.error("Failed to load tiebreaker screen:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    const channelName = `tb-row-${tiebreakerId}-${Date.now()}`;
    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tiebreakers",
          filter: `id=eq.${tiebreakerId}`,
        },
        (payload: any) => {
          if (!mounted) return;
          setTiebreaker(payload.new);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId, tiebreakerId]);

  useEffect(() => {
    if (!tiebreaker || tiebreaker.status !== "finished" || !roomId) return;
    const t = setTimeout(() => {
      router.replace({
        pathname: "/room/[id]/results",
        params: { id: roomId },
      });
    }, 1400);
    return () => clearTimeout(t);
  }, [tiebreaker, roomId, router]);

  const finishTiebreaker = async (winner: Entrant) => {
    if (!tiebreakerId || !roomId) return;

    const now = new Date().toISOString();

    const { error: e1 } = await supabase
      .from("tiebreakers")
      .update({
        status: "finished",
        finished_at: now,
        winner_participant_id: winner.participant_id,
        winner_proposal_id: winner.proposal_id,
      })
      .eq("id", tiebreakerId);

    if (e1) {
      console.error("Failed to finalize tiebreaker:", e1);
      return;
    }

    const { error: e2 } = await supabase
      .from("rooms")
      .update({ winner_proposal_id: winner.proposal_id })
      .eq("id", roomId);

    if (e2) {
      console.error("Failed to set room winner:", e2);
    }
  };

  const getWinnerCenterAngle = (index: number, count: number) => {
    if (count === 2) {
      return index === 0 ? 180 : 0;
    }

    const segment = 360 / count;
    return (index * segment + segment / 2) % 360;
  };

  const handleSpin = async () => {
    if (!isHost || spinning || entrants.length < 2 || !tiebreakerId) return;

    setSpinning(true);

    const winnerIndex = Math.floor(Math.random() * entrants.length);
    const winner = entrants[winnerIndex];

    const pointerAngle = 270;
    const winnerCenter = getWinnerCenterAngle(winnerIndex, entrants.length);

    const extraTurns = 6 * 360;
    const delta = (pointerAngle - winnerCenter + 360) % 360;
    const stopAt = extraTurns + delta;

    rotation.setValue(0);

    Animated.timing(rotation, {
      toValue: stopAt / 360,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      await finishTiebreaker(winner);
      setSpinning(false);
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-black">
        <ActivityIndicator color="#7B2FFF" />
      </SafeAreaView>
    );
  }

  if (!tiebreaker) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-black">
        <Text className="text-white">No tiebreaker found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-6 bg-black">
      <View className="items-center justify-center flex-1 gap-6">
        <Text className="text-2xl font-bold text-white">Tiebreaker</Text>

        <View className="items-center">
          <Text className="mb-3 text-3xl text-yellow-300">▼</Text>

          <Animated.View
            style={{
              width: WHEEL_SIZE,
              height: WHEEL_SIZE,
              transform: [{ rotate: rotationDeg }],
            }}
            className="relative items-center justify-center overflow-hidden rounded-full"
          >
            {entrants.length === 2 ? (
              <>
                <View className="absolute top-0 left-0 w-1/2 h-full bg-[#39C060]" />

                <View className="absolute top-0 right-0 w-1/2 h-full bg-[#FF3B3B]" />

                <View
                  style={{
                    position: "absolute",
                    left: WHEEL_SIZE / 2 - 1,
                    top: 0,
                    width: 0,
                    height: WHEEL_SIZE,
                    backgroundColor: "rgba(0,0,0,0.35)",
                  }}
                />

                <Text
                  style={{
                    position: "absolute",
                    left: 10,
                    width: WHEEL_SIZE / 2 - 20,
                    top: WHEEL_SIZE / 2 - 10,
                    textAlign: "center",
                  }}
                  className="font-semibold text-white"
                  numberOfLines={2}
                >
                  {entrants[0]?.label}
                </Text>

                {/* Right label */}
                <Text
                  style={{
                    position: "absolute",
                    right: 10,
                    width: WHEEL_SIZE / 2 - 20,
                    top: WHEEL_SIZE / 2 - 10,
                    textAlign: "center",
                  }}
                  className="font-semibold text-white"
                  numberOfLines={2}
                >
                  {entrants[1]?.label}
                </Text>
              </>
            ) : (
              <Text className="px-6 text-center text-white">
                {entrants.length > 0
                  ? entrants.map((e) => e.label).join("\n")
                  : "Ingen deltagere"}
              </Text>
            )}
          </Animated.View>
        </View>

        {tiebreaker.status !== "finished" && (
          <Text className="text-sm text-gray-300">
            {isHost
              ? "Click the button to spin the wheel and determine the winner!"
              : "Waiting for the host..."}
          </Text>
        )}

        {isHost && tiebreaker.status !== "finished" && (
          <Pressable
            onPress={handleSpin}
            disabled={spinning || entrants.length < 2}
            className={`items-center justify-center h-12 px-6 rounded-full ${
              spinning || entrants.length < 2
                ? "bg-gray-600 opacity-50"
                : "bg-primary"
            }`}
          >
            <Text className="font-bold text-white">
              {spinning ? "Spinning..." : "Spin the Wheel"}
            </Text>
          </Pressable>
        )}

        {tiebreaker.status === "finished" && (
          <Text className="font-semibold text-green-400">
            Winner found! Redirecting to results...
          </Text>
        )}
      </View>

      <NavigationButton
        href={`/room/${roomId}/results`}
        variant="secondary"
        label="Back to results"
      />
    </SafeAreaView>
  );
}
