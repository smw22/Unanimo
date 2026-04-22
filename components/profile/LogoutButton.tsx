import { Pressable, Text } from "react-native";

interface LogoutButtonProps {
  isSubmitting: boolean;
  onLogout: () => void;
}

export default function LogoutButton({
  isSubmitting,
  onLogout,
}: LogoutButtonProps) {
  return (
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
  );
}
