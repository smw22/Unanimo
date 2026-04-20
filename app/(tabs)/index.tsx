import { Image, Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      <View className="items-center mt-10">
        <View>
          <Image
            source={require("@/assets/images/unanimo-icon.png")}
            className="mb-4 w-30 h-30"
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
    </View>
  );
}
