import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

export default function Layout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
