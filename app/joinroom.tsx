import NavigationHeader from "@/components/NavigationHeader";
import { useJoinRoom } from "@/hooks/use-join-room";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { joinRoomByCode } = useJoinRoom();

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      setErrorMessage("Please enter a room code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const room = await joinRoomByCode(roomCode);

      router.replace({
        pathname: "/room/[id]/waiting",
        params: { id: room.id },
      });
    } catch (error: any) {
      const message = error?.message ?? "Unknown error";

      if (message.toLowerCase().includes("doesn't exist")) {
        setErrorMessage("This room doesn't exist, write another code.");
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 gap-40 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Join with Code" />

      <View className="gap-4 p-6 bg-card rounded-2xl">
        <TextInput
          placeholder="Room Code"
          value={roomCode}
          onChangeText={setRoomCode}
          className="p-4 font-bold text-center text-white border-2 rounded-lg border-primary"
        />

        <Pressable
          onPress={joinRoom}
          disabled={isSubmitting}
          className={`mt-2 h-14 rounded-full bg-primary justify-center items-center ${
            isSubmitting ? "opacity-60" : ""
          }`}
        >
          <Text className="text-lg font-bold text-purple-100">
            {isSubmitting ? "Joining room..." : "Join Room"}
          </Text>
        </Pressable>

        {!!errorMessage && (
          <Text className="text-sm font-semibold text-red-500">
            {errorMessage}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
