import { Stack } from "expo-router";

export default function RoomLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="proposal" />
      <Stack.Screen name="waiting" />
      <Stack.Screen name="voting" />
      <Stack.Screen name="results" />
      <Stack.Screen name="tiebreak" />
      <Stack.Screen name="closed" />
    </Stack>
  );
}
