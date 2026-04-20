import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops! Not Found" }} />
      <View className="items-center justify-center flex-1 bg-gray-800">
        <Link href="/" asChild>
          <Text className="text-xl text-white underline">
            Go back to Home screen
          </Text>
        </Link>
      </View>
    </>
  );
}
