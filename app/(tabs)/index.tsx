import { NavigationButton } from "@/components/NavigationButton";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

export default function Home() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View className="justify-between flex-1 p-6 gap-9 bg-light-bg dark:bg-dark-bg">
      <View className="items-center gap-4 mt-40">
        <Animated.Image
          source={require("@/assets/images/unanimo-icon.png")}
          style={{
            width: 96,
            height: 96,
            opacity: pulseAnim,
          }}
          resizeMode="contain"
        />

        <Text className="text-5xl font-bold text-dark-text dark:text-text-primary">
          Unanimo
        </Text>
        <Text className="mt-0.5 text-gray-500 text-lg leading-6">
          Stop debating. Start deciding.
        </Text>
      </View>

      <View className="gap-4 mb-12">
        <NavigationButton label="Create Room" href="/roomcreation" />
        <NavigationButton
          label="Join with Code"
          variant="secondary"
          href="/joinroom"
        />
      </View>
    </View>
  );
}
