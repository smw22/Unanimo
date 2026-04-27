import Label from "@/components/Label";
import NavigationHeader from "@/components/NavigationHeader";
import { supabase } from "@/lib/supabase";
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
            <Label>EMAIL</Label>
            <TextInput
              className="py-4 rounded-2xl border w-full border-input-border bg-input-bg  px-3.5 text-dark-text dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary dark:bg-input-bg-dark dark:border-input-border-dark"
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
              className="py-4 rounded-2xl border w-full border-input-border bg-input-bg  px-3.5 text-dark-text dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary dark:bg-input-bg-dark dark:border-input-border-dark"
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
