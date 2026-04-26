import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TieBreak() {
  return (
    <SafeAreaView className="items-center justify-center flex-1 bg-light-bg dark:bg-dark-bg">
      <Text className="text-2xl font-bold text-white">
        Tie-breaker round in progress...
      </Text>
    </SafeAreaView>
  );
}
