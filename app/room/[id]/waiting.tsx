import NavigationHeader from "@/components/NavigationHeader";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useRoom } from "@/hooks/use-room";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WaitingRoom() {
  const { profile } = useAuthContext();
  const { id: roomId } = useLocalSearchParams<{ id?: string }>();
  const { room, participants } = useRoom(roomId ?? null);
  const [isStarting, setIsStarting] = useState(false);

  const isHost = room?.host_id === profile?.id;

  const handleStartVoting = async () => {
    if (!room?.id) return;

    setIsStarting(true);
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: "voting" })
        .eq("id", room.id);

      if (error) throw error;

      router.replace({
        pathname: "/room/[id]/voting",
        params: { id: room.id },
      });
    } catch (error) {
      console.error("Error starting voting:", error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 p-container-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title={room?.title || "Waiting Room"} />

      <View className="flex-1 items-center justify-between py-12">
        <View className="items-center gap-4">
          <Text className="text-4xl font-bold tracking-widest text-white">
            {room?.title || "Waiting Room"}
          </Text>
          <Text className="text-xl font-normal tracking-widest rounded-full border-2 border-input-border text-primary py-1 px-4 bg-input-bg">
            code: {room?.code}
          </Text>
        </View>

        <View className="flex-row justify-center">
          <FlatList
            key={"grid-2"}
            data={participants}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "flex-start" }}
            renderItem={({ item }) => (
              <View className="flex items-center w-1/2 gap-3">
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 124,
                    height: 124,
                    backgroundColor: item.profile?.color || "#ccc",
                    padding: 2,
                  }}
                >
                  {item.profile?.avatar_url ? (
                    <Image
                      source={{ uri: item.profile.avatar_url }}
                      style={{
                        width: 124,
                        height: 124,
                        borderRadius: 62,
                      }}
                    />
                  ) : null}
                </View>

                <Text className="font-semibold text-white">
                  {item.profile?.username || "Anonymous"}
                </Text>
              </View>
            )}
          />
        </View>

        {isHost && (
          <Pressable
            onPress={handleStartVoting}
            disabled={isStarting}
            className={`w-full h-14 rounded-full bg-primary justify-center items-center ${
              isStarting ? "opacity-60" : ""
            }`}
          >
            {isStarting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-lg font-bold text-white">Start Voting</Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
