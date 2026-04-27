import { useAuthContext } from "@/hooks/use-auth-context";
import { useRoom } from "@/hooks/use-room";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  const participantCount = participants.length;
  const participantLabel =
    participantCount === 1
      ? "1 participant"
      : `${participantCount} participants`;

  useEffect(() => {
    if (room?.status === "proposal" && room?.id) {
      router.replace({
        pathname: "/room/[id]/proposal",
        params: { id: room.id },
      });
    }
  }, [room?.id, room?.status]);

  const handleStartProposal = async () => {
    if (!room?.id) return;

    setIsStarting(true);
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: "proposal" })
        .eq("id", room.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error starting proposal phase:", error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 p-container-spacing bg-light-bg dark:bg-dark-bg">
      <View className="items-center justify-between flex-1 py-12">
        <View className="items-center gap-4">
          <Text className="text-4xl font-bold tracking-widest text-dark-text dark:text-text-primary">
            {room?.title || "Waiting Room"}
          </Text>
          <Text className="px-4 py-1 text-lg font-semibold tracking-widest border-2 rounded-full border-input-border text-primary bg-input-bg">
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
                    borderWidth: 4,
                    borderColor: item.profile?.color || "#ccc",
                    backgroundColor: item.profile?.avatar_url
                      ? "#fff"
                      : item.profile?.color || "#ccc",
                    overflow: "hidden",
                  }}
                >
                  {item.profile?.avatar_url ? (
                    <Image
                      source={{ uri: item.profile.avatar_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 48,
                        fontWeight: "bold",
                        color: "#fff",
                      }}
                    >
                      {item.profile?.username?.[0]?.toUpperCase() || "?"}
                    </Text>
                  )}
                </View>

                <Text className="font-semibold text-dark-text dark:text-text-primary">
                  {item.profile?.username || "Anonymous"}
                </Text>
              </View>
            )}
          />
        </View>

        <View className="items-center gap-2">
          <Text className="text-sm font-semibold text-primary">
            {participantLabel} in the room
          </Text>
          <Text className="text-sm text-gray-400">
            Waiting for all participants to join...
          </Text>
        </View>

        {isHost && (
          <Pressable
            onPress={handleStartProposal}
            disabled={isStarting}
            className={`w-full h-14 rounded-full bg-primary justify-center items-center ${
              isStarting ? "opacity-60" : ""
            }`}
          >
            {isStarting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-lg font-bold text-white">
                Start Proposal
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
