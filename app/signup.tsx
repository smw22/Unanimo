import Label from "@/components/Label";
import NavigationHeader from "@/components/NavigationHeader";
import AvatarColorSection from "@/components/profile/AvatarColorSection";
import AvatarImageSection from "@/components/profile/AvatarImageSection";
import { COLORS } from "@/helpers/color-conversion";
import { uploadAvatar } from "@/lib/storage-service";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(
    null,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      setSelectedAvatarUri(result.assets[0].uri);
    } catch (error: any) {
      Alert.alert("Image selection failed", error?.message ?? "Unknown error");
    }
  };

  const onSignUp = async () => {
    if (!email.trim() || !password || !username.trim()) {
      Alert.alert(
        "Missing fields",
        "Email, password, and username are required.",
      );
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert(
        "Invalid username",
        "Username must be at least 3 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: username.trim(),
            color: color.trim() || null,
            avatar_url: selectedAvatarUri ? null : avatarUrl.trim() || null,
          },
        },
      });

      if (error) throw error;

      if (selectedAvatarUri && data?.user?.id) {
        try {
          setIsUploadingImage(true);
          const publicUrl = await uploadAvatar(selectedAvatarUri, data.user.id);
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ avatar_url: publicUrl })
            .eq("id", data.user.id);

          if (updateError) {
            throw updateError;
          }
        } catch (uploadError: any) {
          console.warn("Avatar upload failed during signup:", uploadError);
          Toast.show({
            type: "error",
            text1: "Avatar upload failed",
            text2: uploadError?.message ?? "Please try again later",
          });
        } finally {
          setIsUploadingImage(false);
        }
      }

      Toast.show({
        type: "success",
        text1: "Profile created successfully",
        visibilityTime: 1000,
      });
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Sign up failed", error?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="justify-between flex-1 gap-3 px-6 bg-light-bg dark:bg-dark-bg">
      <ScrollView>
        <NavigationHeader title="Create a profile" />

        <View className="gap-3 mt-6">
          <View className="items-start gap-1">
            <Label>EMAIL</Label>
            <TextInput
              className="py-4 rounded-2xl border-2 w-full border-input-border bg-input-bg  px-3.5 text-dark-text dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary dark:bg-input-bg-dark dark:border-input-border-dark"
              placeholder="Email"
              placeholderTextColor="#8d8d8d"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="items-start gap-1">
            <Label>PASSWORD</Label>
            <TextInput
              className="py-4 rounded-2xl border-2 w-full border-input-border bg-input-bg  px-3.5 text-dark-text dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary dark:bg-input-bg-dark dark:border-input-border-dark"
              placeholder="Password"
              placeholderTextColor="#8d8d8d"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View className="items-start gap-1">
            <Label>USERNAME</Label>
            <TextInput
              className="py-4 rounded-2xl border-2 w-full border-input-border bg-input-bg  px-3.5 text-dark-text dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary dark:bg-input-bg-dark dark:border-input-border-dark"
              placeholder="Username"
              placeholderTextColor="#8d8d8d"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View className="items-start w-full gap-1">
            <AvatarColorSection
              colors={COLORS}
              currentColor={color || null}
              updatingColor={null}
              onColorChange={setColor}
            />
          </View>

          <View className="items-start gap-1">
            <AvatarImageSection
              avatarUrl={selectedAvatarUri}
              isUploading={isUploadingImage}
              onPickImage={onPickImage}
            />
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={onSignUp}
        disabled={isSubmitting}
        className={`mt-2 h-14 rounded-full bg-primary justify-center items-center mb-12 ${
          isSubmitting ? "opacity-60" : ""
        }`}
      >
        <Text className="text-lg font-bold text-white">
          {isSubmitting ? "Creating..." : "Create Profile"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
