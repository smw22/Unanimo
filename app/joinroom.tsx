import NavigationHeader from "@/components/NavigationHeader";
import { useJoinRoom } from "@/hooks/use-join-room";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinRoomByCode } = useJoinRoom();

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert("Missing code", "Please enter a room code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const room = await joinRoomByCode(roomCode);

      router.replace({
        pathname: "/room/[id]/waiting",
        params: { id: room.id },
      });
    } catch (error: any) {
      const message = error?.message ?? "Unknown error";

      if (message.toLowerCase().includes("doesn't exist")) {
        Alert.alert(
          "Room not found",
          "This room doesn't exist, write another code.",
        );
      } else {
        Alert.alert("Please enter a valid room code");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 gap-40 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Join with Code" />

      <View className="gap-4 p-6 bg-light-bg dark:bg-dark-bg rounded-2xl">
        <TextInput
          placeholder="Room Code"
          value={roomCode}
          onChangeText={setRoomCode}
          className="p-4 font-bold text-center border-2 rounded-lg text-dark-text dark:text-text-primary border-primary"
        />

        <Pressable
          onPress={joinRoom}
          disabled={isSubmitting}
          className={` h-14 rounded-full bg-primary justify-center items-center ${
            isSubmitting ? "opacity-60" : ""
          }`}
        >
          <Text className="text-lg font-bold text-purple-100">
            {isSubmitting ? "Joining room..." : "Join Room"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
