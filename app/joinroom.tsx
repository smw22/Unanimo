import NavigationHeader from "@/components/NavigationHeader";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

export default function JoinRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const joinRoom = async () => {
    setIsSubmitting(true);
    try {
    } catch (error: any) {
      Alert.alert("Failed to join room", error?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 gap-32 p-container-spacing pt-top-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Join with Code" />

      <View className="flex gap-4 p-6 bg-card">
        <TextInput
          placeholder="Room Code"
          className="p-4 font-bold text-center text-white border-2 rounded-lg border-primary placeholder:text-white"
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
    </View>
  );
}
