import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";

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
          border: "none",
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -20,
                    width: "64px",
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#7B2FFF",
                  }}
                />
              )}
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={color}
                size={24}
              />
              <Text style={{ color, fontSize: 12 }}>Home</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -20,
                    width: "64px",
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#7B2FFF",
                  }}
                />
              )}
              <Ionicons
                name={focused ? "time-sharp" : "time-outline"}
                color={color}
                size={24}
              />
              <Text style={{ color, fontSize: 12 }}>History</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -20,
                    width: "64px",
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#7B2FFF",
                  }}
                />
              )}
              <Ionicons
                name={focused ? "person-sharp" : "person-outline"}
                color={color}
                size={24}
              />
              <Text style={{ color, fontSize: 12 }}>Profile</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
