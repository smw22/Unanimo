import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProposalScreen() {
  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <View className="flex-1 justify-center gap-4">
        <Text className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Your proposal
        </Text>

        <TextInput
          placeholder="Write your proposal"
          placeholderTextColor="#8d8d8d"
          className="w-full rounded-2xl border-2 border-input-border bg-input-bg px-4 py-4 text-lg text-white"
        />
      </View>
    </SafeAreaView>
  );
}
