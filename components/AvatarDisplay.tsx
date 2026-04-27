import { Image, Text, View } from "react-native";

export default function AvatarDisplay({
  avatar_url,
  username,
  color,
  size = 40,
}: {
  avatar_url?: string | null;
  username?: string | undefined;
  color?: string | null | undefined;
  size?: number;
}) {
  if (avatar_url) {
    return (
      <Image
        source={{ uri: avatar_url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color ?? "#7b2fff",
      }}
    >
      <Text className="text-xs font-bold text-white">
        {getInitials(username)}
      </Text>
    </View>
  );
}

// get initials helper
function getInitials(username: string | undefined): string {
  if (!username) return "?";
  return username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
