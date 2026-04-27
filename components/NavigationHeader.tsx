import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type NavigationHeaderProps = {
  title?: string;
};

export default function NavigationHeader({ title }: NavigationHeaderProps) {
  const router = useRouter();

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <View className="relative justify-center mt-15">
      <Pressable onPress={onBack} className="self-start py-2 pr-3">
        <View className="flex-row items-center gap-1">
          <ArrowLeft size={16} color="#6f2cff" />
          <Text className="text-sm font-bold text-primary">Back</Text>
        </View>
      </Pressable>

      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        {!!title && (
          <Text className="text-lg font-bold text-black dark:text-white">
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}
