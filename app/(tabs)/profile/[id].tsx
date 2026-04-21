import NavigationHeader from "@/components/NavigationHeader";
import { useLocalSearchParams } from "expo-router";
import {
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Switch,
  TextInput,
} from "react-native";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";
import Toast from "react-native-toast-message";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Label from "@/components/Label";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Profile() {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");

  const { id } = useLocalSearchParams();
  const { data: profile, isLoading, error, refetch } = useProfile(id as string);

  // Sync edited username with profile data when it loads
  useEffect(() => {
    if (profile?.username) {
      setEditedUsername(profile.username);
    }
  }, [profile?.username]);

  const onSaveUsername = async () => {
    if (!editedUsername.trim()) {
      Toast.show({
        type: "error",
        text1: "Username cannot be empty",
      });
      return;
    }

    if (editedUsername.trim().length < 3) {
      Toast.show({
        type: "error",
        text1: "Username must be at least 3 characters",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: editedUsername.trim() })
        .eq("id", id);

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Username updated successfully",
      });

      setIsEditingUsername(false);
      refetch?.(); // Refresh profile data if your hook has refetch
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to update username",
        text2: error?.message ?? "Unknown error",
      });
      // Reset to original if save fails
      setEditedUsername(profile?.username || "");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    setEditedUsername(profile?.username || "");
    setIsEditingUsername(false);
  };

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
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 p-container-spacing pt-top-spacing bg-light-bg dark:bg-dark-bg">
      <NavigationHeader title="Profile" />

      {isLoading && <ActivityIndicator size="large" color="#7B2FFF" />}
      {error && <Text className="text-red-500 mt-4">Error: {error}</Text>}

      {profile && (
        <>
          {/* Username Section */}
          <View className="mt-4">
            {isEditingUsername ? (
              <View className="flex-row items-center gap-2 border-2 border-purple-600 rounded-lg px-3 py-2">
                <TextInput
                  className="flex-1 text-white text-lg"
                  placeholder="Enter username"
                  placeholderTextColor="#888"
                  value={editedUsername}
                  onChangeText={setEditedUsername}
                  editable={!isSubmitting}
                />
                <Pressable
                  onPress={onSaveUsername}
                  disabled={isSubmitting}
                  className="p-2"
                >
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={isSubmitting ? "#888" : "#7B2FFF"}
                  />
                </Pressable>
                <Pressable
                  onPress={onCancel}
                  disabled={isSubmitting}
                  className="p-2"
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={isSubmitting ? "#888" : "#999"}
                  />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditingUsername(true)}
                className="flex-row items-center justify-between border-2 border-input-border rounded-lg px-3 py-3 bg-input-bg"
              >
                <Text className="text-white text-lg font-semibold">
                  {profile.username}
                </Text>
                <Ionicons name="pencil" size={20} color="#7B2FFF" />
              </Pressable>
            )}
          </View>

          <Text className="text-text-primary mt-4">User ID: {profile.id}</Text>
          <Text className="text-text-primary mt-4">
            Avatar: {profile.avatar_url}
          </Text>
          <Text className="text-text-primary mt-4">Color: {profile.color}</Text>

          <View className="items-start gap-2 mt-6">
            <Label>OPTIONS</Label>

            <View className="flex-row justify-between w-full p-4 border-2 rounded-2xl bg-input-bg border-input-border">
              <View className="flex-col flex-1">
                <Text className="text-sm font-bold text-white">
                  Notifications
                </Text>
                <Text className="text-xs text-gray-400">Never miss out</Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#7B2FFF" }}
                thumbColor={"#f4f3f4"}
                ios_backgroundColor="#1A1A1A"
                onValueChange={setIsNotificationsEnabled}
                value={isNotificationsEnabled}
              />
            </View>
          </View>

          <Pressable
            onPress={onLogout}
            disabled={isSubmitting}
            className={`mt-6 h-14 rounded-full bg-primary justify-center items-center ${
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
