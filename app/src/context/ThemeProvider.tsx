// ThemeProvider.js
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme } from "../theme/theme";
import { ThemeContext } from "./ThemeContext";

export default function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
