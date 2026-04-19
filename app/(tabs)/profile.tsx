import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function Profile() {
  const theme = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={styles.container}></View>;
}

function createStyles(theme: { colors: { background: string } }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 50,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
    },
  });
}
