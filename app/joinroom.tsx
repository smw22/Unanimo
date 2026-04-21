import NavigationHeader from "@/components/NavigationHeader";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert("Missing field", "Please enter a room code.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Joining room:", roomCode);
      Alert.alert("Success", "Joined room!");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Failed to join room", error?.message ?? "Unknown error");
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
      </View>
    </SafeAreaView>
  );
}
