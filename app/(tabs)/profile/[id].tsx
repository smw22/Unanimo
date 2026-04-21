import NavigationHeader from "@/components/NavigationHeader";
import { useLocalSearchParams } from "expo-router";
import { Text, View, ActivityIndicator } from "react-native";
import { useProfile } from "@/hooks/use-profile";

export default function Profile() {
  const { id } = useLocalSearchParams();
  const { data: profile, isLoading, error } = useProfile(id as string);

  return (
    <View className="flex-1 p-container-spacing pt-top-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Profile" />

      {isLoading && <ActivityIndicator size="large" color="#7B2FFF" />}

      {error && <Text className="text-red-500 mt-4">Error: {error}</Text>}

      {profile && (
        <>
          <Text className="text-text-primary mt-4">User ID: {profile.id}</Text>
          <Text className="text-text-primary mt-4">
            Username: {profile.username}
          </Text>
          <Text className="text-text-primary mt-4">
            Avatar: {profile.avatar_url}
          </Text>
          <Text className="text-text-primary mt-4">Color: {profile.color}</Text>
        </>
      )}
    </View>
  );
}
