import Label from "@/components/Label";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, View } from "react-native";

interface Color {
  name: string;
  hex: string;
}

interface AvatarColorSectionProps {
  colors: Color[];
  currentColor: string | null;
  updatingColor: string | null;
  onColorChange: (colorName: string) => void;
}

export default function AvatarColorSection({
  colors,
  currentColor,
  updatingColor,
  onColorChange,
}: AvatarColorSectionProps) {
  return (
    <View className="gap-1 mt-6">
      <Label>COLOR</Label>
      <View className="flex-row gap-3">
        {colors.map((color) => (
          <Pressable
            key={color.name}
            onPress={() => onColorChange(color.name)}
            disabled={updatingColor !== null}
            className={`w-20 h-20 rounded-lg border-4 justify-center items-center ${
              currentColor === color.name
                ? "border-white"
                : "border-transparent"
            } ${updatingColor === color.name ? "opacity-60" : ""}`}
            style={{ backgroundColor: color.hex }}
          >
            {updatingColor === color.name && (
              <ActivityIndicator color="#fff" size="small" />
            )}
            {currentColor === color.name && updatingColor !== color.name && (
              <Ionicons name="checkmark" size={28} color="#fff" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
