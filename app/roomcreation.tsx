import Label from "@/components/Label";
import NavigationHeader from "@/components/NavigationHeader";
import QuantityPicker from "@/components/QuantityPicker";
import { useCreateRoom } from "@/hooks/create-room";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoomCreation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isTimeLimited, setIsTimeLimited] = useState(false);
  const { createRoom: createRoomAPI } = useCreateRoom();
  const [qty, setQty] = useState(1);

  async function createRoom() {
    if (!roomName.trim()) {
      Alert.alert("Please enter a room name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const room = await createRoomAPI(roomName, {
        isAnonymous,
        isTimeLimited,
        maxParticipants: qty,
      });

      Alert.alert("Room created", `Your room code is: ${room.code}`);
      router.replace("/waitingroom");
    } catch (error: any) {
      Alert.alert("Failed to create room", error?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 px-container-spacing gap-9 bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Create a room" />
      <View className="gap-6 rounded-2xl">
        <View className="items-start gap-2">
          <Label>ROOM NAME</Label>
          <TextInput
            placeholder="Friday plans..."
            placeholderTextColor="#8d8d8d"
            value={roomName}
            onChangeText={setRoomName}
            className="w-full p-4 font-bold text-left text-white border-2 rounded-2xl bg-input-bg border-input-border"
          />
        </View>

        <View className="items-start gap-2">
          <Label>OPTIONS</Label>

          <View className="flex-row justify-between w-full p-4 border-2 rounded-2xl bg-input-bg border-input-border">
            <View className="flex-col flex-1">
              <Text className="text-sm font-bold text-white">
                Anonymous voting
              </Text>
              <Text className="text-xs text-gray-400">
                Names hidden from results
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#7B2FFF" }}
              thumbColor={"#f4f3f4"}
              ios_backgroundColor="#1A1A1A"
              onValueChange={setIsAnonymous}
              value={isAnonymous}
            />
          </View>

          <View className="flex-row justify-between w-full p-4 border-2 rounded-2xl bg-input-bg border-input-border">
            <View className="flex-col flex-1">
              <Text className="text-sm font-bold text-white">Time limited</Text>
              <Text className="text-xs text-gray-400">
                Set a timer for voting
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              <Text className="text-sm font-bold text-primary">5 min</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#7B2FFF" }}
                thumbColor={"#f4f3f4"}
                ios_backgroundColor="#1A1A1A"
                onValueChange={setIsTimeLimited}
                value={isTimeLimited}
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between w-full p-4 border-2 rounded-2xl bg-input-bg border-input-border">
            <View className="flex-col flex-1">
              <Text className="text-sm font-bold text-white">
                Max participants
              </Text>
              <Text className="text-xs text-gray-400">Limit who can join</Text>
            </View>
            <QuantityPicker value={qty} onChange={setQty} min={1} max={10} />
          </View>
        </View>

        <Pressable
          onPress={createRoom}
          disabled={isSubmitting}
          className={`mt-2 h-14 rounded-full bg-primary justify-center items-center ${
            isSubmitting ? "opacity-60" : ""
          }`}
        >
          <Text className="text-lg font-bold text-purple-100">
            {isSubmitting ? "Creating room..." : "Create Room"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
