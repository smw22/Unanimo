import Label from "@/components/Label";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";

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
  const colorScheme = useColorScheme();

  return (
    <View className="mt-4">
      <Label>USERNAME</Label>
      {isEditing ? (
        <View className="flex-row items-center gap-2 px-3 py-2 border-2 rounded-lg border-primary">
          <TextInput
            className="flex-1 text-lg text-dark-text dark:text-text-primary"
            placeholder="Enter username"
            placeholderTextColor="#888"
            value={editedUsername}
            onChangeText={onChangeText}
            editable={!isSubmitting}
          />
          <Pressable onPress={onSave} disabled={isSubmitting} className="py-2">
            <Ionicons
              name="checkmark"
              size={24}
              color={isSubmitting ? "#888" : "#7B2FFF"}
            />
          </Pressable>
          <Pressable
            onPress={onCancel}
            disabled={isSubmitting}
            className="py-2"
          >
            <Ionicons
              name="close"
              size={24}
              color={
                isSubmitting ? "#888" : colorScheme === "dark" ? "#fff" : "#000"
              }
            />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onEdit}
          className="flex-row items-center justify-between px-3 py-3 border-2 rounded-lg border-input-border bg-input-bg  px-3.5 text-dark-text dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary dark:bg-input-bg-dark dark:border-input-border-dark"
        >
          <Text className="text-lg font-semibold text-dark-text dark:text-text-primary">
            {username}
          </Text>
          <Ionicons
            name="pencil"
            size={20}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </Pressable>
      )}
    </View>
  );
}
