import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ThemeProvider from "./src/context/ThemeProvider";

export default function Layout() {
  return (
    <>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </>
  );
}
