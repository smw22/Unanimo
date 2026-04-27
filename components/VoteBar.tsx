import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

// Animated vote bar
export default function VoteBar({
  count,
  max,
  isWinner,
}: {
  count: number;
  max: number;
  isWinner: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? count / max : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: isWinner ? "#8B5CF6" : "#4B5563",
          width: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}
