import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { BedEntry } from "@/types";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";

interface BedCardProps {
  entry: BedEntry;
  onPress?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function BedCard({ entry, onPress }: BedCardProps) {
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  const tierColor = entry.score >= 90 ? theme.success : entry.score >= 75 ? theme.accent : entry.score >= 60 ? theme.accent2 : theme.warning;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
      testID="bed-card"
    >
      <Image source={{ uri: entry.imageUri }} style={styles.image} resizeMode="cover" />
      <View style={[styles.scoreBadge, { backgroundColor: theme.surface }]}>
        <Text style={[styles.scoreNumber, { color: theme.text }]}>{entry.score}</Text>
        <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.date, { color: theme.textSubtle }]}>{formatDate(entry.date)}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{entry.title}</Text>
        <Text style={[styles.affirmation, { color: theme.textMuted }]} numberOfLines={2}>{entry.affirmation}</Text>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.breakdown}>
          <Chip label="Edges" value={entry.edgesScore} theme={theme} />
          <Chip label="Symmetry" value={entry.symmetryScore} theme={theme} />
          <Chip label="Smooth" value={entry.smoothnessScore} theme={theme} />
          <View style={{ flex: 1 }} />
          <ChevronRight size={18} color={theme.textSubtle} />
        </View>
      </View>
    </Pressable>
  );
}

function Chip({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof getTheme> }) {
  return (
    <View style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}>
      <Text style={[styles.chipLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
  },
  scoreBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: spacing.lg,
  },
  date: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  affirmation: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  breakdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 2,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chipValue: {
    fontSize: 13,
    fontWeight: "800",
  },
});
