import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Closed() {
  return (
    <SafeAreaView className="items-center justify-center flex-1 bg-light-bg dark:bg-dark-bg">
      <Text className="text-2xl font-bold text-white">
        This room is closed.
      </Text>
    </SafeAreaView>
  );
}
