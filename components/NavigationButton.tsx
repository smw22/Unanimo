import { Href, router } from "expo-router";
import { Pressable, Text, StyleSheet } from "react-native";

type NavigationButtonProps = {
  label: string;
  href: Href;
  variant?: "primary" | "secondary";
};

export function NavigationButton({
  label,
  href,
  variant = "primary",
}: NavigationButtonProps) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={[styles.button, variant === "secondary" && styles.buttonSecondary]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.buttonSecondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6f2cff",
  },
  buttonSecondary: {
    borderWidth: 2,
    borderColor: "#6f2cff",
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f3ff",
  },
  buttonSecondaryText: {
    color: "#6f2cff",
  },
});
