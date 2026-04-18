import { Image, StyleSheet, Text, View } from "react-native";
import { NavigationButton } from "@/components/NavigationButton";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View>
            <Image
              source={require("@/assets/images/unanimo-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Unanimo</Text>
          <Text style={styles.subtitle}>Stop debating. Start deciding.</Text>
        </View>

        <View style={styles.buttonGroup}>
          <NavigationButton
            label="Create Profile"
            href="/signup"
            variant="primary"
          />
          <NavigationButton label="Login" href="/signin" variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 36,
  },
  hero: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 18,
  },
  title: {
    color: "#f4f4f4",
    fontSize: 50,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    color: "#7f7f7f",
    fontSize: 18,
    lineHeight: 24,
  },
  buttonGroup: {
    gap: 18,
    marginBottom: 8,
  },
});
