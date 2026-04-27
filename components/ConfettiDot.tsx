import { View } from "react-native";

// Confetti dot component
export function ConfettiDot({
  color,
  style,
}: {
  color: string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
          transform: [{ rotate: "30deg" }],
        },
        style,
      ]}
    />
  );
}

export const CONFETTI_DOTS = [
  { color: "#FF6B6B", top: 10, left: 30 },
  { color: "#4CAF50", top: 20, left: 90 },
  { color: "#FF9800", top: 8, left: 160 },
  { color: "#9C27B0", top: 25, left: 220 },
  { color: "#2196F3", top: 12, left: 280 },
  { color: "#FF6B6B", top: 30, right: 60 },
  { color: "#4CAF50", top: 15, right: 20 },
  { color: "#FF9800", top: 5, right: 110 },
];
