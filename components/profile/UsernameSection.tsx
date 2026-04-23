import { View, TextInput, Pressable, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/Label";

interface UsernameSectionProps {
  username: string;
  isEditing: boolean;
  editedUsername: string;
  isSubmitting: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChangeText: (text: string) => void;
}

export default function UsernameSection({
  username,
  isEditing,
  editedUsername,
  isSubmitting,
  onEdit,
  onSave,
  onCancel,
  onChangeText,
}: UsernameSectionProps) {
  return (
    <View className="mt-4">
      <Label>USERNAME</Label>
      {isEditing ? (
        <View className="flex-row items-center gap-2 border-2 border-purple-600 rounded-lg px-3 py-2">
          <TextInput
            className="flex-1 text-white text-lg"
            placeholder="Enter username"
            placeholderTextColor="#888"
            value={editedUsername}
            onChangeText={onChangeText}
            editable={!isSubmitting}
          />
          <Pressable onPress={onSave} disabled={isSubmitting} className="p-2">
            <Ionicons
              name="checkmark"
              size={20}
              color={isSubmitting ? "#888" : "#7B2FFF"}
            />
          </Pressable>
          <Pressable onPress={onCancel} disabled={isSubmitting} className="p-2">
            <Ionicons
              name="close"
              size={20}
              color={isSubmitting ? "#888" : "#999"}
            />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onEdit}
          className="flex-row items-center justify-between border-2 border-input-border rounded-lg px-3 py-3 bg-input-bg"
        >
          <Text className="text-white text-lg font-semibold">{username}</Text>
          <Ionicons name="pencil" size={20} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
