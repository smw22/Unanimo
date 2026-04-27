import { useRoomResults } from "@/hooks/use-room-results";
import { router, useLocalSearchParams } from "expo-router";
import {
  Image,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getInitials(username: string | undefined): string {
  if (!username) return "?";
  return username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function AvatarDisplay({
  avatar_url,
  username,
  color,
  size = "md",
}: {
  avatar_url: string | null | undefined;
  username: string | undefined;
  color: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-2xl",
  };

  if (avatar_url) {
    return (
      <Image
        source={{ uri: avatar_url }}
        className={`${sizeClasses[size]} rounded-full`}
      />
    );
  }

  return (
    <View
      className={`${sizeClasses[size]} items-center justify-center rounded-full`}
      style={{ backgroundColor: color ?? "#7b2fff" }}
    >
      <Text className={`${textSizeClasses[size]} font-bold text-white`}>
        {getInitials(username)}
      </Text>
    </View>
  );
}

export default function RoomResults() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const roomId = id ?? null;
  const { data, isLoading, error } = useRoomResults(roomId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#7B2FFF" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 px-container-spacing bg-light-bg dark:bg-dark-bg items-center justify-center">
        <Text className="text-text-secondary dark:text-text-secondary">
          {error ?? "Room not found"}
        </Text>
      </SafeAreaView>
    );
  }

  const winningProposal = data.proposals[0];
  const totalVotes = winningProposal.yes_votes + winningProposal.no_votes;

  return (
    <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-container-spacing pt-4 pb-6 border-b border-border dark:border-border">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-primary dark:text-primary text-sm font-semibold">
              ← back
            </Text>
          </Pressable>

          <Text className="text-2xl font-bold text-dark-text dark:text-white mb-2">
            {winningProposal.content}
          </Text>

          <Text className="text-xs text-text-secondary dark:text-text-secondary">
            {new Date(data.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            --- {data.participant_count} members
          </Text>
        </View>

        <View className="px-container-spacing py-6">
          {/* Winner Section */}
          <View className="mb-6 p-4 border-2 border-primary/50 rounded-2xl bg-card dark:bg-card">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-primary dark:text-primary">
                WINNER
              </Text>
              <Text className="text-xs text-text-secondary dark:text-text-secondary">
                {winningProposal.yes_votes} out of {totalVotes} voted yes
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <AvatarDisplay
                avatar_url={winningProposal.creator.avatar_url}
                username={winningProposal.creator.username}
                color={winningProposal.creator.color}
                size="md"
              />

              <View className="flex-1">
                <Text className="text-xs text-text-secondary dark:text-text-secondary mb-1">
                  Proposed by {winningProposal.creator.username}
                </Text>
                <Text className="text-sm font-semibold text-dark-text dark:text-white">
                  {winningProposal.content}
                </Text>
                <Text className="text-xs text-text-secondary dark:text-text-secondary mt-1">
                  {winningProposal.yes_votes} yes • {winningProposal.no_votes}{" "}
                  no
                </Text>
              </View>
            </View>
          </View>

          {/* All Options */}
          <Text className="text-xs font-bold text-text-secondary dark:text-text-secondary mb-3">
            ALL OPTIONS ↓
          </Text>

          <View className="gap-2 mb-6">
            {data.proposals.map((proposal) => (
              <View
                key={proposal.id}
                className="p-3 rounded-lg bg-card dark:bg-card border border-border dark:border-border"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-2">
                    <AvatarDisplay
                      avatar_url={proposal.creator.avatar_url}
                      username={proposal.creator.username}
                      color={proposal.creator.color}
                      size="sm"
                    />
                    <View className="flex-1">
                      <Text className="text-xs text-text-secondary dark:text-text-secondary">
                        {proposal.creator.username}
                      </Text>
                      <Text className="text-sm font-medium text-dark-text dark:text-white">
                        {proposal.content}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-xs text-success dark:text-success font-semibold">
                      {proposal.yes_votes} yes
                    </Text>
                    <Text className="text-xs text-text-secondary dark:text-text-secondary">
                      {proposal.no_votes} no
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
