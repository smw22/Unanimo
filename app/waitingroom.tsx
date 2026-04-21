import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WaitingRoom() {
  return (
    <SafeAreaView className="items-center justify-center flex-1 bg-light-bg dark:bg-dark-bg">
      <Text>Waiting Room</Text>
    </SafeAreaView>
  );
}
