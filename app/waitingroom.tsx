import NavigationHeader from "@/components/NavigationHeader";
import { useRoom } from "@/hooks/use-room";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WaitingRoom() {
  const { roomId } = useLocalSearchParams();
  const { room, participants } = useRoom(roomId as string);

  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title={room?.title || "Waiting Room"} />

      <View className="items-center gap-12 mt-12">
        <View className="items-center gap-4 ">
          <Text className="text-4xl font-bold tracking-widest text-white">
            {room?.title || "Waiting Room"}
          </Text>
          <Text className="text-xl font-normal tracking-widest rounded-full border-2 border-input-border text-[#666666] py-1 px-4 bg-input-bg">
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
                    backgroundColor: "#fff",
                    borderWidth: 2,
                    borderColor: item.profile?.color || "#ccc",
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
                        fontSize: 40,
                        color: item.profile?.color || "#ccc",
                        fontWeight: "bold",
                      }}
                    >
                      {item.profile?.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  )}
                </View>

                <Text className="font-semibold text-white">
                  {item.profile?.username || "Anonymous"}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
