import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaView className="flex-1 px-4 pt-12 bg-light-bg dark:bg-dark-bg">
      <Text className="text-text-primary">hejsa</Text>
    </SafeAreaView>
  );
}
