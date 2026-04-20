import { View, Text, Image, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
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
});
