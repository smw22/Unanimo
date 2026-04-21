import NavigationHeader from "@/components/NavigationHeader";
import { useRoom } from "@/hooks/use-room";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WaitingRoom() {
  const { roomId } = useLocalSearchParams();
  const { room, participants } = useRoom(roomId as string);

  return (
    <SafeAreaView className="flex-1 px-6 bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title={room?.title || "Waiting Room"} />

      <View className="gap-6 mt-6">
        <View className="gap-2 ">
          <Text className="text-4xl font-bold tracking-widest text-white">
            {room?.code}
          </Text>
        </View>

        <View className="gap-2">
          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="grid bg-card border-border">
                <Text className="font-semibold text-white">
                  {item.profiles?.avatar_url}
                  {item.profiles?.color}
                  {item.profiles?.username || "Anonymous"}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
