import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";

const TabIcon = ({ color, focused, iconName, label }: any) => (
  <View className="items-center justify-center">
    {focused && (
      <View className="absolute -top-5 w-16 h-1 rounded bg-purple-600" />
    )}
    <Ionicons name={iconName} color={color} size={24} />
    <Text style={{ color, fontSize: 12 }}>{label}</Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7B2FFF",
        tabBarInactiveTintColor: "#888",
        headerStyle: {
          backgroundColor: "#25292e",
        },
        headerShown: false,
        headerShadowVisible: false,
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#111111",
          paddingTop: 20,
          paddingBottom: 20,
          height: "auto",
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              iconName={focused ? "home-sharp" : "home-outline"}
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              iconName={focused ? "time-sharp" : "time-outline"}
              label="History"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              iconName={focused ? "person-sharp" : "person-outline"}
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}
