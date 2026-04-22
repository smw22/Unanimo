import { View, Image, Pressable, Text, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/Label";

interface AvatarImageSectionProps {
  avatarUrl: string | null;
  isUploading: boolean;
  onPickImage: () => void;
}

export default function AvatarImageSection({
  avatarUrl,
  isUploading,
  onPickImage,
}: AvatarImageSectionProps) {
  return (
    <View className="mt-6">
      <Label>AVATAR IMAGE</Label>
      <View className="items-center gap-4">
        {avatarUrl ? (
          <Image
            key={avatarUrl}
            source={{ uri: avatarUrl }}
            style={{ width: 128, height: 128, borderRadius: 8 }}
            onLoadStart={() => console.log("🖼️ Image loading started...")}
            onLoad={() => console.log("✅ Image loaded successfully")}
            onError={(error) => console.error("❌ Image load error:", error)}
          />
        ) : (
          <View className="w-32 h-32 bg-gray-700 rounded-lg justify-center items-center">
            <Ionicons name="image" size={40} color="#888" />
          </View>
        )}
        <Pressable
          onPress={onPickImage}
          disabled={isUploading}
          className={`px-6 py-3 rounded-lg bg-purple-600 flex-row items-center gap-2 ${
            isUploading ? "opacity-60" : ""
          }`}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="cloud-upload" size={18} color="#fff" />
          )}
          <Text className="text-white font-semibold">
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
