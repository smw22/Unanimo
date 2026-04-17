import { Stack } from "expo-router";
import ThemeProvider from "./src/context/ThemeProvider";

export default function Layout() {
  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}
