import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Moon, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme, radius, spacing } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

export default function SleepScreen() {
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  return (
    <View style={[styles.container, { backgroundColor: "#0E1024" }]}>
      <LinearGradient
        colors={["#1B1F3B", "#0E1024", "#0E1024"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.inner} edges={["top"]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>NIGHT ROUTINE</Text>
            <Text style={styles.header}>Sleep</Text>
          </View>
          <View style={styles.moonBadge}>
            <Moon size={20} color="#F5C97B" />
          </View>
        </View>

        <View style={styles.comingSoonWrap}>
          <View style={styles.iconWrap}>
            <View style={styles.iconGlow} />
            <Sparkles size={40} color="#F5C97B" />
          </View>
          <Text style={styles.comingTitle}>Coming Soon</Text>
          <Text style={styles.comingBody}>
            Bedtime stories, ambient soundscapes, and guided breathing exercises are being crafted to help you drift off peacefully.
          </Text>
          <View style={[styles.pill, { backgroundColor: "rgba(245,201,123,0.12)", borderColor: "rgba(245,201,123,0.25)" }]}>
            <Moon size={12} color="#F5C97B" />
            <Text style={styles.pillText}>In development</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: "#A9A8C4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  header: {
    color: "#F4EFE3",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  moonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245,201,123,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245,201,123,0.3)",
  },
  comingSoonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(245,201,123,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,201,123,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(245,201,123,0.12)",
    opacity: 0.6,
  },
  comingTitle: {
    color: "#F4EFE3",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  comingBody: {
    color: "#A9A8C4",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 300,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    color: "#F5C97B",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
