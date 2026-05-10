import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { BedEntry } from "@/types";

interface Props {
  entry: BedEntry;
  userName: string;
}

export const SHARE_CARD_WIDTH = 540;
export const SHARE_CARD_HEIGHT = 960;

export default function ShareCard({ entry, userName }: Props) {
  return (
    <View style={styles.container} collapsable={false}>
      <Image source={{ uri: entry.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={["rgba(14,16,36,0.15)", "rgba(14,16,36,0.45)", "rgba(14,16,36,0.95)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <View style={styles.brandPill}>
          <Sparkles size={14} color="#FF8A65" />
          <Text style={styles.brand}>BedVibe</Text>
        </View>
        <Text style={styles.date}>{entry.date}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>BED SCORE</Text>
        <Text style={styles.score}>{entry.score}</Text>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.affirm}>{entry.affirmation}</Text>
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <Stat label="Edges" value={entry.edgesScore} />
          <Stat label="Symmetry" value={entry.symmetryScore} />
          <Stat label="Smooth" value={entry.smoothnessScore} />
        </View>
        <Text style={styles.user}>— {userName}</Text>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: "#0E1024",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 40,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brand: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  date: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 56,
  },
  eyebrow: {
    color: "#FF8A65",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  score: {
    color: "#FFF",
    fontSize: 180,
    fontWeight: "800",
    letterSpacing: -8,
    lineHeight: 180,
  },
  title: {
    color: "#FFF",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginTop: 4,
  },
  affirm: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 22,
    lineHeight: 30,
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 28,
  },
  stat: {},
  statValue: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  user: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
});
