import { useRoom } from "@/hooks/use-room";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function normalizeRoomStatus(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase();

  if (value === "waiting") return "waiting";
  if (value === "voting") return "voting";
  if (value === "closed") return "closed";
  if (value === "tiebreak") return "tiebreak";
  if (value === "finished" || value === "results") return "results";

  return "waiting";
}

export default function RoomIndex() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const roomId = typeof id === "string" ? id : null;
  const { room, isLoading, error } = useRoom(roomId);

  if (!roomId) {
    return <Redirect href="/(tabs)" />;
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-light-bg dark:bg-dark-bg">
        <ActivityIndicator size="large" color="#7B2FFF" />
        <Text className="mt-4 text-base text-gray-500">Loading room...</Text>
      </SafeAreaView>
    );
  }

  if (error || !room) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-container-spacing bg-light-bg dark:bg-dark-bg">
        <View className="w-full gap-3 rounded-2xl border border-input-border bg-input-bg p-6 dark:border-input-border-dark dark:bg-input-bg-dark">
          <Text className="text-center text-xl font-bold text-gray-900 dark:text-white">
            Room not available
          </Text>
          <Text className="text-center text-sm text-gray-500">
            {error ?? "This room does not exist or you do not have access."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const routeByStatus = normalizeRoomStatus(room.status);

  if (routeByStatus === "waiting") {
    return (
      <Redirect
        href={{ pathname: "/room/[id]/waiting", params: { id: roomId } }}
      />
    );
  }

  if (routeByStatus === "voting") {
    return (
      <Redirect
        href={{ pathname: "/room/[id]/voting", params: { id: roomId } }}
      />
    );
  }

  if (routeByStatus === "results") {
    return (
      <Redirect
        href={{ pathname: "/room/[id]/results", params: { id: roomId } }}
      />
    );
  }

  if (routeByStatus === "tiebreak") {
    return (
      <Redirect
        href={{ pathname: "/room/[id]/tiebreak", params: { id: roomId } }}
      />
    );
  }

  return (
    <Redirect
      href={{ pathname: "/room/[id]/closed", params: { id: roomId } }}
    />
  );
}
