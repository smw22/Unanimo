import { NavigationButton } from "@/components/NavigationButton";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

export default function Index() {
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
    <View className="flex-1 p-6 bg-light-bg dark:bg-dark-bg">
      <View className="justify-between gap-9">
        <View className="items-center gap-4 mt-40">
          <View>
            <Animated.Image
              source={require("@/assets/images/unanimo-icon.png")}
              style={{
                width: 96,
                height: 96,
                opacity: pulseAnim,
              }}
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
