import { NavigationButton } from "@/components/NavigationButton";
import { Image, Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-col flex-1 px-20 gap-9 bg-light-bg dark:bg-dark-bg">
      <View className="items-center mt-10">
        <View>
          <Image
            source={require("@/assets/images/unanimo-icon.png")}
            className="w-24 h-24 mb-4"
            resizeMode="contain"
          />
        </View>

        <Text className="text-5xl font-bold text-dark-text dark:text-text-primary">
          Unanimo
        </Text>
        <Text className="mt-0.5 text-gray-500 text-lg leading-6">
          Stop debating. Start deciding.
        </Text>
      </View>

      <View className="flex flex-col gap-4">
        <NavigationButton label="Create Room" href="/onboarding" />
        <NavigationButton
          label="Join with Code"
          variant="secondary"
          href="/onboarding"
        />
      </View>
    </View>
  );
}
