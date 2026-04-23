import { useAuthContext } from "@/hooks/use-auth-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Text, View, useColorScheme } from "react-native";

const TabIcon = ({ color, focused, iconName, label }: any) => (
  <View className="items-center justify-center">
    {focused && (
      <View className="absolute w-16 h-1 bg-purple-600 rounded -top-5" />
    )}
    <Ionicons name={iconName} color={color} size={24} />
    <Text style={{ color, fontSize: 12, width: "100%" }}>{label}</Text>
  </View>
);

export default function TabLayout() {
  const { claims } = useAuthContext();
  const userId = claims?.id;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // pick the same colors you defined in tailwind.config.js
  const tabBarBg = isDark ? "#0B0B0D" : "#F5F6F8";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7B2FFF",
        tabBarInactiveTintColor: "#888",
        headerStyle: {
          backgroundColor: isDark ? "#25292e" : "#ffffff",
        },
        headerShown: false,
        headerShadowVisible: false,
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: tabBarBg, // use computed color
          paddingTop: 20,
          paddingBottom: 60,
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
      {userId && (
        <Tabs.Screen
          name="profile"
          options={{
            href: `profile/${userId}`,
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
      )}
    </Tabs>
  );
}
