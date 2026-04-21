import NavigationHeader from "@/components/NavigationHeader";
import { View } from "react-native";

export default function RoomCreation() {
  return (
    <View className="justify-between flex-1 p-container-spacing pt-top-spacing gap-9 bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Create a room" />
    </View>
  );
}
