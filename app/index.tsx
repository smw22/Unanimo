import { NavigationButton } from "@/components/NavigationButton";
import { Image, Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      <View className="justify-between flex-1 px-7 pt-18 pb-9">
        <View className="items-center mt-10">
          <View>
            <Image
              source={require("@/assets/images/unanimo-icon.png")}
              className="mb-4 w-30 h-30"
              resizeMode="contain"
            />
          </View>

          <Text className="text-5xl font-bold text-white">Unanimo</Text>
          <Text className="mt-0.5 text-gray-600 text-lg leading-6">
            Stop debating. Start deciding.
          </Text>
        </View>

        <View className="gap-4 mb-2">
          <NavigationButton
            label="Create Profile"
            href="/signup"
            variant="primary"
          />
          <NavigationButton label="Login" href="/login" variant="secondary" />
        </View>
      </View>
    </View>
  );
}
