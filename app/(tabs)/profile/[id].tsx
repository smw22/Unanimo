import NavigationHeader from "@/components/NavigationHeader";
import { useLocalSearchParams } from "expo-router";
import {
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Switch,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";
import { uploadAvatar } from "@/lib/storage-service";
import Toast from "react-native-toast-message";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Label from "@/components/Label";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

const COLORS = [
  { name: "purple", hex: "#7B2FFF" },
  { name: "green", hex: "#22C55E" },
  { name: "red", hex: "#EF4444" },
  { name: "yellow", hex: "#FBBF24" },
];

export default function Profile() {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [updatingColor, setUpdatingColor] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null); // ← NEW

  const { id } = useLocalSearchParams();
  const { data: profile, isLoading, error, refetch } = useProfile(id as string);

  // Sync edited username with profile data when it loads
  useEffect(() => {
    if (profile?.username) {
      setEditedUsername(profile.username);
    }
    if (profile?.avatar_url) {
      setDisplayAvatarUrl(profile.avatar_url); // ← NEW: Keep display in sync
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
      console.log("📸 Starting image picker...");

      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      console.log("🔐 Permission result:", permissionResult.granted);

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access the media library is required.",
        );
        return;
      }

      // Pick image
      console.log("🎨 Launching image library...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("✂️ Image picker result:", {
        canceled: result.canceled,
        uri: result.assets?.[0]?.uri,
      });

      if (result.canceled) {
        console.log("⏹️ User canceled image selection");
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log("📤 Selected image URI:", imageUri);

      setIsUploadingImage(true);

      // Upload to Supabase
      console.log("🚀 Calling uploadAvatar...");
      const publicUrl = await uploadAvatar(imageUri, id as string);
      console.log("✨ Avatar URL received:", publicUrl);

      // Update profile with avatar_url
      console.log("💾 Updating profile in database...");
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", id);

      if (error) {
        console.error("❌ Database update error:", error);
        throw error;
      }

      console.log("🎉 Profile updated successfully");

      // ✅ IMMEDIATELY update the display state
      console.log("🖼️ Updating display avatar URL...");
      setDisplayAvatarUrl(publicUrl);

      // Then refetch in background to sync hook state
      console.log("🔄 Refetching profile...");
      await refetch?.();
      console.log("✅ Refetch complete");

      Toast.show({
        type: "success",
        text1: "Avatar uploaded successfully",
      });
    } catch (error: any) {
      console.error("💥 Image upload failed:", error);
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
      <NavigationHeader title="Profile" />

      {isLoading && <ActivityIndicator size="large" color="#7B2FFF" />}
      {error && <Text className="text-red-500 mt-4">Error: {error}</Text>}

      {profile && (
        <>
          {/* Username Section */}
          <View className="mt-4">
            <Label>USERNAME</Label>
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

          {/* Avatar Image & Upload */}
          <View className="mt-6">
            <Label>AVATAR IMAGE</Label>
            <View className="items-center gap-4">
              {displayAvatarUrl ? (
                <Image
                  key={displayAvatarUrl}
                  source={{ uri: displayAvatarUrl }}
                  className="w-32 h-32 rounded-lg"
                />
              ) : (
                <View className="w-32 h-32 bg-gray-700 rounded-lg justify-center items-center">
                  <Ionicons name="image" size={40} color="#888" />
                </View>
              )}
              <Pressable
                onPress={onPickImage}
                disabled={isUploadingImage}
                className={`px-6 py-3 rounded-lg bg-purple-600 flex-row items-center gap-2 ${
                  isUploadingImage ? "opacity-60" : ""
                }`}
              >
                {isUploadingImage ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="cloud-upload" size={18} color="#fff" />
                )}
                <Text className="text-white font-semibold">
                  {isUploadingImage ? "Uploading..." : "Upload Photo"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Avatar / Color Section */}
          <View className="mt-6">
            <Label>AVATAR COLOR</Label>
            <View className="flex-row gap-3">
              {COLORS.map((color) => (
                <Pressable
                  key={color.name}
                  onPress={() => onColorChange(color.name)}
                  disabled={updatingColor !== null}
                  className={`w-20 h-20 rounded-lg border-4 justify-center items-center ${
                    profile.color === color.name
                      ? "border-white"
                      : "border-transparent"
                  } ${updatingColor === color.name ? "opacity-60" : ""}`}
                  style={{ backgroundColor: color.hex }}
                >
                  {updatingColor === color.name && (
                    <ActivityIndicator color="#fff" size="small" />
                  )}
                  {profile.color === color.name &&
                    updatingColor !== color.name && (
                      <Ionicons name="checkmark" size={28} color="#fff" />
                    )}
                </Pressable>
              ))}
            </View>
          </View>

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
