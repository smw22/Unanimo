import NavigationHeader from "@/components/NavigationHeader";
import { supabase } from "@/lib/supabase";
import { Label } from "@react-navigation/elements";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Logged in successfully",
        visibilityTime: 1000,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login failed", error?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="justify-between flex-1 gap-3 p-container-spacing bg-light-bg dark:bg-dark-bg">
      <View>
        <NavigationHeader title="Login" />
        <View className="gap-3 mt-6">
          <View className="items-start gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              EMAIL
            </Label>
            <TextInput
              className="py-4 rounded-3.5 border-1.5 w-full border-border bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Email"
              placeholderTextColor="#8d8d8d"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="items-start gap-1">
            <Label className="text-xs font-semibold text-text-secondary">
              PASSWORD
            </Label>
            <TextInput
              className="py-4 rounded-3.5 border-1.5 border-border w-full bg-card px-3.5 text-text-primary placeholder:text-gray-600"
              placeholder="Password"
              placeholderTextColor="#8d8d8d"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>
      </View>

      <Pressable
        onPress={onLogin}
        disabled={isSubmitting}
        className={`mt-2 h-14 rounded-full bg-primary justify-center items-center ${
          isSubmitting ? "opacity-60" : ""
        }`}
      >
        <Text className="text-lg font-bold text-purple-100">
          {isSubmitting ? "Logging in..." : "Login"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
