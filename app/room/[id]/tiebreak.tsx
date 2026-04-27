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

  useEffect(() => {
    if (!tiebreakerId) {
      setLoading(false);
      return;
    }

    let mounted = true;

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

    fetchRow();

    // Build channel with .on() BEFORE .subscribe()
    const channel = supabase
      .channel(`tiebreaker:${tiebreakerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tiebreakers",
          filter: `id=eq.${tiebreakerId}`,
        },
        (payload) => {
          console.log("Tiebreaker updated:", payload.new);
          if (mounted) setTiebreaker(payload.new);
        },
      )
      .subscribe(); // Call subscribe AFTER all .on() handlers

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [tiebreakerId]);

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
          <Text className="text-sm text-gray-300">
            Waiting for host to arm the tiebreaker…
          </Text>
        )}

        {tiebreaker.status === "armed" && timeToGreen !== null && (
          <>
            <Text className="text-3xl font-bold text-white">
              {timeToGreen > 0 ? Math.ceil(timeToGreen / 1000) : "GO!"}
            </Text>

            <Pressable
              onPress={() => {
                console.log("Tapped (implement attempt insert)");
              }}
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
        onPress={() => router.replace(`/room/${roomId}/results`)}
        className="items-center justify-center w-full h-12 bg-gray-800 rounded-full"
      >
        <Text className="text-white">Back to results</Text>
      </Pressable>
    </SafeAreaView>
  );
}
