import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.tabIndicator} />}
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={color}
                size={24}
              />
              <Text style={[styles.tabLabel, { color }]}>Home</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.tabIndicator} />}
              <Ionicons
                name={focused ? "time-sharp" : "time-outline"}
                color={color}
                size={24}
              />
              <Text style={[styles.tabLabel, { color }]}>History</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.tabIndicator} />}
              <Ionicons
                name={focused ? "person-sharp" : "person-outline"}
                color={color}
                size={24}
              />
              <Text style={[styles.tabLabel, { color }]}>Profile</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIndicator: {
    position: "absolute",
    top: -20,
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#7B2FFF",
  },
  tabIcon: {
    fontSize: 24,
  },
  tabLabel: {
    color: "#888",
    fontSize: 12,
  },
});
