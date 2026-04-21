import NavigationHeader from "@/components/NavigationHeader";
import { useLocalSearchParams } from "expo-router";
import { Text, View, ActivityIndicator, Pressable } from "react-native";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";
import Toast from "react-native-toast-message";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { id } = useLocalSearchParams();
  const { data: profile, isLoading, error } = useProfile(id as string);

  const onLogout = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      Toast.show({
        type: "success",
        text1: "Logged out successfully",
        visibilityTime: 1000,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Logout failed",
        text2: error?.message ?? "Unknown error",
      });
      setIsSubmitting(false); // ✅ Only reset if we're NOT navigating away
    }
  };

  return (
    <SafeAreaView className="flex-1 p-container-spacing pt-top-spacing bg-light-bg dark:bg-dark-bg">
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

          <Pressable
            onPress={onLogout}
            disabled={isSubmitting}
            className={`mt-2 h-14 rounded-full bg-primary justify-center items-center ${
              isSubmitting ? "opacity-60" : ""
            }`}
          >
            <Text className="text-lg font-bold text-purple-100">
              {isSubmitting ? "Logging out..." : "Logout"}
            </Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}
