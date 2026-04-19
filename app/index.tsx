import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "./src/context/ThemeContext";

export default function App() {
  const theme = useTheme();

  const [instruments, setInstruments] = useState<any[]>([]);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data } = await supabase.from("instruments").select();
    setInstruments(data ?? []);
  }

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <FlatList
        data={instruments}
        keyExtractor={(item) =>
          item.id ? item.id.toString() : Math.random().toString()
        }
        renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
      />
    </View>
  );
}

function createStyles(theme: { colors: { background: string; text: string } }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 50,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
    },
    item: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
      color: theme.colors.text,
    },
  });
}
