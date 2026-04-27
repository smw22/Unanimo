import { useHistory } from "@/hooks/use-history";
import { router } from "expo-router";
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
}: {
  avatar_url: string | null | undefined;
  username: string | undefined;
  color: string | null | undefined;
}) {
  if (avatar_url) {
    return (
      <Image source={{ uri: avatar_url }} className="w-12 h-12 rounded-full" />
    );
  }

  return (
    <View
      className="w-12 h-12 items-center justify-center rounded-full"
      style={{ backgroundColor: color ?? "#7b2fff" }}
    >
      <Text className="text-sm font-bold text-white">
        {getInitials(username)}
      </Text>
    </View>
  );
}

function getTimePeriod(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 0;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 1;
  } else if (date > oneWeekAgo) {
    return 2;
  } else if (date > oneMonthAgo) {
    return 3;
  } else {
    return 4;
  }
}

export default function HistoryIndex() {
  const { history, isLoading, error } = useHistory();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 px-container-spacing bg-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 px-container-spacing bg-dark-bg items-center justify-center">
        <Text className="text-text-secondary">{error}</Text>
      </SafeAreaView>
    );
  }

  const grouped = history.reduce(
    (acc, item) => {
      const period = getTimePeriod(item.created_at);
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(item);
      return acc;
    },
    {} as Record<number, typeof history>,
  );

  const periods = [
    { key: 0, label: "Today" },
    { key: 1, label: "Yesterday" },
    { key: 2, label: "This week" },
    { key: 3, label: "Last month" },
    { key: 4, label: "Earlier" },
  ];

  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-light-bg dark:bg-dark-bg">
      <View className="py-4 border-b border-input-border dark:border-border mb-4">
        <Text className="text-2xl font-bold text-dark-text dark:text-white">
          History
        </Text>
        <Text className="text-sm text-text-secondary dark:text-text-secondary mt-1">
          Your past decisions
        </Text>
      </View>

      {history.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-secondary dark:text-text-secondary text-lg">
            No decisions yet
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {periods.map((period) => {
            const items = grouped[period.key];
            if (!items || items.length === 0) return null;

            return (
              <View key={period.key} className="mb-6">
                <Text className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-3">
                  {period.label}
                </Text>

                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/history/${item.id}`)}
                    className="flex-row items-center gap-3 mb-4 p-3 rounded-lg bg-input-bg dark:bg-card active:opacity-70 border border-input-border dark:border-border"
                  >
                    <AvatarDisplay
                      avatar_url={item.winning_creator.avatar_url}
                      username={item.winning_creator.username}
                      color={item.winning_creator.color}
                    />

                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-dark-text dark:text-white">
                        {item.winning_proposal.content}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <Text className="text-xs text-text-secondary dark:text-text-secondary">
                          {item.participant_count} members
                        </Text>
                        <Text className="text-xs text-text-secondary dark:text-text-secondary">
                          •
                        </Text>
                        <Text className="text-xs text-text-secondary dark:text-text-secondary">
                          {item.winning_proposal.yes_votes} yes
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-xs text-text-secondary dark:text-text-secondary">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text className="text-xs text-success dark:text-success font-semibold mt-1">
                        {item.winning_creator.username}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
