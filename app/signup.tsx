import NavigationHeader from "@/components/NavigationHeader";
import { supabase } from "@/lib/supabase";
import { Label } from "@react-navigation/elements";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

      Alert.alert(
        "Account created",
        "If email confirmation is enabled, confirm your email before signing in.",
      );
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Sign up failed", error?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <NavigationHeader title="Create a profile" />

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

          <View style={{ gap: 4 }}>
            <Label style={styles.label}>USERNAME</Label>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#8d8d8d"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* TODO - ADD THE THEME COLOR PICKER */}
          <View style={{ gap: 4 }}>
            <Label style={styles.label}>COLOR</Label>
            <TextInput
              style={styles.input}
              placeholder="Color (optional)"
              placeholderTextColor="#8d8d8d"
              value={color}
              onChangeText={setColor}
            />
          </View>

          {/* TODO - ADD IMAGE UPLOADER FOR AVATAR */}
          <View style={{ gap: 4 }}>
            <Label style={styles.label}>AVATAR URL</Label>
            <TextInput
              style={styles.input}
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
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Creating..." : "Create Profile"}
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
