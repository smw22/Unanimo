import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProposalScreen() {
  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <View className="flex-1 justify-between py-8">
        <View className="items-center">
          <Text className="text-base font-bold text-white">
            Add your proposal
          </Text>
        </View>

        <View className="flex-1 justify-start gap-3 pt-10">
          <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Proposal title
          </Text>

          <TextInput
            placeholder="Go to the cinema!!"
            placeholderTextColor="#8d8d8d"
            className="w-full rounded-2xl border border-[#232323] bg-[#151515] px-4 py-3 text-base text-white"
          />
        </View>

        <Pressable className="h-14 w-full items-center justify-center rounded-full bg-primary active:opacity-80">
          <Text className="text-base font-bold text-white">Add proposal</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
