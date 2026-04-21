import NavigationHeader from "@/components/NavigationHeader";
import { supabase } from "@/lib/supabase";
import { Label } from "@react-navigation/elements";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            avatar_url: avatarUrl.trim() || null,
          },
        },
      });

      if (error) throw error;

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
    <View className="justify-between flex-1 gap-3 px-6 bg-light-bg dark:bg-dark-bg">
      <View>
        <NavigationHeader title="Create a profile" />

        <View className="gap-3 mt-6">
          <View className="gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              EMAIL
            </Label>
            <TextInput
              className="py-4 rounded-2xl border-2 border-border bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Email"
              placeholderTextColor="#8d8d8d"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              PASSWORD
            </Label>
            <TextInput
              className="py-4 rounded-2xl border-2 border-border bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Password"
              placeholderTextColor="#8d8d8d"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View className="gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              USERNAME
            </Label>
            <TextInput
              className="py-4 rounded-2xl border-2 border-border bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Username"
              placeholderTextColor="#8d8d8d"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View className="gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              COLOR
            </Label>
            <TextInput
              className="py-4 rounded-2xl border-2 border-border bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Color (optional)"
              placeholderTextColor="#8d8d8d"
              value={color}
              onChangeText={setColor}
            />
          </View>

          <View className="gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              AVATAR URL
            </Label>
            <TextInput
              className="py-4 rounded-2xl border-2 border-border bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Avatar URL (optional)"
              placeholderTextColor="#8d8d8d"
              autoCapitalize="none"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
            />
          </View>
        </View>
      </View>

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
    </View>
  );
}
