import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TieBreak() {
  const { id: roomId, tiebreakerId } = useLocalSearchParams<{
    id?: string;
    tiebreakerId?: string;
  }>();
  const { profile } = useAuthContext();
  const [tiebreaker, setTiebreaker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeToGreen, setTimeToGreen] = useState<number | null>(null);
  const [room, setRoom] = useState<any | null>(null);
  const [arming, setArming] = useState(false);
  const [myParticipant, setMyParticipant] = useState<any | null>(null);

  useEffect(() => {
    if (!tiebreakerId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let channel: any;

    const fetchRow = async () => {
      try {
        const { data } = await supabase
          .from("tiebreakers")
          .select("*")
          .eq("id", tiebreakerId)
          .maybeSingle();
        if (mounted) setTiebreaker(data || null);
      } catch (e) {
        console.error("fetch tiebreaker", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const setupRealtimeWithRetry = () => {
      try {
        channel = supabase
          .channel(`tiebreak-screen:${tiebreakerId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tiebreakers",
              filter: `id=eq.${tiebreakerId}`,
            },
            (payload: any) => {
              console.log("✅ Tiebreaker realtime update:", payload.new);
              if (mounted) setTiebreaker(payload.new);
            },
          )
          .subscribe((status: any) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Channel subscribed successfully");
            }
          });
      } catch (e) {
        console.error("❌ Realtime setup failed:", e);
      }
    };

    fetchRow();
    setupRealtimeWithRetry();

    return () => {
      mounted = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [tiebreakerId]);

  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();
      setRoom(data);
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !profile?.id) return;
    const fetchMyParticipant = async () => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", profile.id)
        .maybeSingle();
      setMyParticipant(data);
    };
    fetchMyParticipant();
  }, [roomId, profile?.id]);

  // compute ms until green
  useEffect(() => {
    if (!tiebreaker?.green_at) {
      setTimeToGreen(null);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const greenTs = new Date(tiebreaker.green_at).getTime();
      const diff = Math.max(0, greenTs - now);
      setTimeToGreen(diff);
    }, 50);

    return () => clearInterval(interval);
  }, [tiebreaker?.green_at]);

  const isHost = profile?.id === room?.host_id;

  const handleArmTiebreaker = async () => {
    if (!tiebreakerId || arming) return; // Prevent multiple calls

    setArming(true);
    try {
      const greenAt = new Date(Date.now() + 3000);
      const { error } = await supabase
        .from("tiebreakers")
        .update({ status: "armed", green_at: greenAt })
        .eq("id", tiebreakerId);
      if (error) {
        console.error("Failed to arm tiebreaker:", error);
      } else {
        console.log("✅ Tiebreaker armed");
      }
    } catch (e) {
      console.error("Error arming tiebreaker:", e);
    } finally {
      setArming(false);
    }
  };

  const handleTap = async () => {
    if (!tiebreakerId || !myParticipant || !tiebreaker?.green_at) return;

    const reactionMs = Math.max(
      0,
      Date.now() - new Date(tiebreaker.green_at).getTime(),
    );
    const isFalseStart = reactionMs < 0;

    try {
      const { error } = await supabase.from("tiebreaker_attempts").insert({
        tiebreaker_id: tiebreakerId,
        participant_id: myParticipant.id,
        proposal_id: myParticipant.proposal_id, // from tiebreaker_participants
        reaction_ms: Math.abs(reactionMs),
        false_start: isFalseStart,
      });

      if (error) {
        console.error("Failed to record attempt:", error);
      } else {
        console.log("✅ Attempt recorded:", { reactionMs, isFalseStart });
      }
    } catch (e) {
      console.error("Error recording attempt:", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-light-bg dark:bg-dark-bg">
        <ActivityIndicator color="#7B2FFF" />
      </SafeAreaView>
    );
  }

  if (!tiebreaker) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-light-bg dark:bg-dark-bg">
        <Text className="text-white">No tiebreaker found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-6 bg-black">
      <View className="items-center justify-center flex-1 gap-6">
        <Text className="text-2xl font-bold text-white">Tiebreaker</Text>
        <Text className="text-sm text-gray-400">
          Status: {tiebreaker.status}
        </Text>

        {tiebreaker.status === "pending" && (
          <>
            <Text className="text-sm text-gray-300">
              Waiting for host to arm the tiebreaker…
            </Text>
            {isHost && (
              <Pressable
                onPress={handleArmTiebreaker}
                disabled={arming || tiebreaker.status !== "pending"}
                className={`items-center justify-center h-12 px-6 rounded-full ${
                  arming || tiebreaker.status !== "pending"
                    ? "bg-gray-600 opacity-50"
                    : "bg-purple-600"
                }`}
              >
                <Text className="font-bold text-white">
                  {arming ? "Arming..." : "Arm Tiebreaker"}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {tiebreaker.status === "armed" && timeToGreen !== null && (
          <>
            <Text className="text-3xl font-bold text-white">
              {timeToGreen > 0 ? Math.ceil(timeToGreen / 1000) : "GO!"}
            </Text>

            <Pressable
              onPress={handleTap}
              className="items-center justify-center w-64 bg-green-500 rounded-full h-14"
            >
              <Text className="font-bold text-white">TAP</Text>
            </Pressable>
          </>
        )}

        {tiebreaker.status === "finished" && (
          <View className="items-center">
            <Text className="font-semibold text-white">Finished</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => {
          if (!roomId) {
            console.error("Room ID not available");
            return;
          }
          router.replace({
            pathname: "/room/[id]/results",
            params: { id: roomId },
          });
        }}
        className="items-center justify-center w-full h-12 bg-gray-800 rounded-full"
      >
        <Text className="text-white">Back to results</Text>
      </Pressable>
    </SafeAreaView>
  );
}
