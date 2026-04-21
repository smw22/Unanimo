import NavigationHeader from "@/components/NavigationHeader";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoomCreation() {
  return (
    <SafeAreaView className="justify-between flex-1 px-container-spacing gap-9 bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Create a room" />
    </SafeAreaView>
  );
}
