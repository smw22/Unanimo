import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function App() {
  const [instruments, setInstruments] = useState<any[]>([]);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data } = await supabase.from("instruments").select();
    setInstruments(data ?? []);
  }

  return (
    <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
      <FlatList
        data={instruments}
        keyExtractor={(item) =>
          item.id ? item.id.toString() : Math.random().toString()
        }
        renderItem={({ item }) => (
          <Text className="p-4 text-black border-b border-gray-200 dark:border-gray-700 dark:text-white">
            {item.name}
          </Text>
        )}
      />
    </View>
  );
}
