import Label from "@/components/Label";
import AvatarColorSection from "@/components/profile/AvatarColorSection";
import AvatarImageSection from "@/components/profile/AvatarImageSection";
import LogoutButton from "@/components/profile/LogoutButton";
import UsernameSection from "@/components/profile/UsernameSection";
import { COLORS } from "@/helpers/color-conversion";
import { useProfile } from "@/hooks/use-profile";
import { uploadAvatar } from "@/lib/storage-service";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Profile() {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [updatingColor, setUpdatingColor] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null);

  const { id } = useLocalSearchParams();
  const { data: profile, isLoading, error, refetch } = useProfile(id as string);

  useEffect(() => {
    if (profile?.username) {
      setEditedUsername(profile.username);
    }
    if (profile?.avatar_url) {
      setDisplayAvatarUrl(profile.avatar_url);
    }
  }, [profile?.username, profile?.avatar_url]);

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
      refetch?.();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to update username",
        text2: error?.message ?? "Unknown error",
      });
      setEditedUsername(profile?.username || "");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    setEditedUsername(profile?.username || "");
    setIsEditingUsername(false);
  };

  const onColorChange = async (colorName: string) => {
    if (profile?.color === colorName) return;

    setUpdatingColor(colorName);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ color: colorName })
        .eq("id", id);

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: `Color changed to ${colorName}`,
        visibilityTime: 800,
      });

      refetch?.();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to update color",
        text2: error?.message ?? "Unknown error",
      });
    } finally {
      setUpdatingColor(null);
    }
  };

  const onPickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access the media library is required.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setIsUploadingImage(true);

      const publicUrl = await uploadAvatar(imageUri, id as string);

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setDisplayAvatarUrl(publicUrl);
      await refetch?.();

      Toast.show({
        type: "success",
        text1: "Avatar uploaded successfully",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to upload avatar",
        text2: error?.message ?? "Unknown error",
      });
    } finally {
      setIsUploadingImage(false);
    }
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
      <ScrollView>
        <View className="pb-4 justify-center items-center">
          <Text className="text-2xl font-bold text-white">Profile</Text>
        </View>

        {isLoading && <ActivityIndicator size="large" color="#7B2FFF" />}
        {error && <Text className="mt-4 text-red-500">Error: {error}</Text>}

        {profile && (
          <>
            <UsernameSection
              username={profile.username}
              isEditing={isEditingUsername}
              editedUsername={editedUsername}
              isSubmitting={isSubmitting}
              onEdit={() => setIsEditingUsername(true)}
              onSave={onSaveUsername}
              onCancel={onCancel}
              onChangeText={setEditedUsername}
            />

            <AvatarImageSection
              avatarUrl={displayAvatarUrl}
              isUploading={isUploadingImage}
              onPickImage={onPickImage}
            />

            <AvatarColorSection
              colors={COLORS}
              currentColor={profile.color}
              updatingColor={updatingColor}
              onColorChange={onColorChange}
            />

            <View className="items-start gap-2">
              <Label>OPTIONS</Label>

              <View className="flex-row justify-between w-full p-4 border-2 rounded-2xl bg-input-bg border-input-border">
                <View className="flex-col flex-1">
                  <Text className="text-sm font-bold text-dark-text dark:text-text-primary">
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

            <LogoutButton isSubmitting={isSubmitting} onLogout={onLogout} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
