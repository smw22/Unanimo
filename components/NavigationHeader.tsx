import { useRouter } from "expo-router";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";

type NavigationHeaderProps = {
  title?: string;
};

export default function NavigationHeader({ title }: NavigationHeaderProps) {
  const router = useRouter();

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backPressable}>
        <View style={styles.backButton}>
          <ArrowLeft size={16} color="#6f2cff" />{" "}
          <Text style={styles.backButtonText}>Back</Text>
        </View>
      </Pressable>

      <View pointerEvents="none" style={styles.titleLayer}>
        {!!title && <Text style={styles.title}>{title}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
    justifyContent: "center",
    position: "relative",
  },
  backPressable: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
  },
  titleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backButtonText: {
    color: "#6f2cff",
    fontSize: 14,
    fontWeight: "700",
  },
});
