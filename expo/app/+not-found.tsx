import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
// BedVibe not found screen

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.text}>This screen does not exist in BedVibe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F7F5F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 24,
    textAlign: "center",
  },
  link: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4A7C6F",
    borderRadius: 12,
  },
  linkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
