import { Href, router } from "expo-router";
import { Pressable, Text } from "react-native";

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
      className={`h-15.5 rounded-full justify-center items-center ${
        variant === "primary"
          ? "bg-primary"
          : "border-2 border-primary bg-transparent"
      }`}
    >
      <Text
        className={`text-xl font-bold ${
          variant === "primary" ? "text-purple-200" : "text-primary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
