import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import NavigationHeader from "@/components/NavigationHeader";
import { Label } from "@react-navigation/elements";
import { supabase } from "@/lib/supabase";

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

      Alert.alert("Login successful", "Welcome back!");
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Login failed", error?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <NavigationHeader title="Login" />
        <View style={styles.form}>
          <View style={{ gap: 4 }}>
            <Label style={styles.label}>EMAIL</Label>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8d8d8d"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Label style={styles.label}>PASSWORD</Label>
            <TextInput
              style={styles.input}
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
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    gap: 12,
  },
  form: {
    marginTop: 24,
    gap: 12,
  },
  label: {
    alignSelf: "flex-start",
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2b2b2b",
    backgroundColor: "#151515",
    paddingHorizontal: 14,
    color: "#f4f4f4",
  },
  button: {
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6f2cff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#f5f3ff",
    fontWeight: "700",
    fontSize: 18,
  },
});
