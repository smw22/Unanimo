import { useProposalPhase } from "@/hooks/use-proposal-phase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const roomId = id ?? null;
  const {
    room,
    content,
    setContent,
    hasSubmitted,
    isSubmitting,
    error,
    progressText,
    submitProposal,
    shouldRedirectToVoting,
  } = useProposalPhase(roomId);

  useEffect(() => {
    if (shouldRedirectToVoting && room?.id) {
      router.replace({
        pathname: "/room/[id]/voting",
        params: { id: room.id },
      });
    }
  }, [room?.id, shouldRedirectToVoting]);

  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <View className="justify-between flex-1 py-8">
        {!hasSubmitted ? (
          <>
            <View className="items-center">
              <Text className="text-base font-bold text-dark-text dark:text-text-primary">
                Add your proposal
              </Text>
            </View>

            <View className="justify-start flex-1 gap-3 pt-10">
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Proposal title
              </Text>

              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Go to the cinema!!"
                placeholderTextColor="#8d8d8d"
                className="w-full px-4 py-3 text-base border text-dark-text dark:text-text-primary rounded-2xl bg-light-bg dark:bg-dark-bg"
              />

              {!!error && (
                <Text className="text-sm font-semibold text-red-500">
                  {error}
                </Text>
              )}
            </View>

            <Pressable
              onPress={submitProposal}
              disabled={isSubmitting}
              className={`h-14 w-full items-center justify-center rounded-full bg-primary active:opacity-80 ${
                isSubmitting ? "opacity-60" : ""
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Add proposal
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <View className="items-center justify-center flex-1 gap-3">
            <Text className="text-base font-bold text-white">
              Waiting for all proposals...
            </Text>
            <Text className="text-sm font-semibold text-primary">
              {progressText}
            </Text>
            {!!error && (
              <Text className="text-sm font-semibold text-red-500">
                {error}
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
