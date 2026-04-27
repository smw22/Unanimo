import Label from "@/components/Label";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

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
    <View className="w-full gap-1 mt-6">
      <Label>AVATAR IMAGE</Label>
      <View className="items-start w-full gap-4">
        {avatarUrl ? (
          <Image
            key={avatarUrl}
            source={{ uri: avatarUrl }}
            style={{
              width: "50%",
              borderRadius: 8,
              aspectRatio: "1/1",
            }}
            onLoadStart={() => console.log("🖼️ Image loading started...")}
            onLoad={() => console.log("✅ Image loaded successfully")}
            onError={(error) => console.error("❌ Image load error:", error)}
          />
        ) : (
          <View className="items-center justify-center w-1/2 bg-gray-700 rounded-lg aspect-square">
            <Ionicons name="image" size={40} color="#888" />
          </View>
        )}
        <Pressable
          onPress={onPickImage}
          disabled={isUploading}
          className={`px-6 py-3 rounded-lg bg-primary flex-row items-center gap-2  w-1/2 ${
            isUploading ? "opacity-60" : ""
          }`}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="cloud-upload" size={18} color="#fff" />
          )}
          <Text className="font-semibold text-dark-text dark:text-text-primary">
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
