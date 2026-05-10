import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Achievement } from "@/lib/achievements";
import { getTheme, radius } from "@/constants/colors";

interface Props {
  achievement: Achievement;
  earned: boolean;
  theme: ReturnType<typeof getTheme>;
}

const RARITY_COLOR: Record<Achievement["rarity"], string> = {
  common: "#9A93A0",
  rare: "#8FA8FF",
  epic: "#B294E8",
  legendary: "#F5C97B",
};

export default function AchievementCard({ achievement, earned, theme }: Props) {
  const rarityColor = RARITY_COLOR[achievement.rarity];
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: earned ? theme.surface : theme.surfaceAlt,
          borderColor: earned ? rarityColor : theme.border,
          opacity: earned ? 1 : 0.55,
        },
      ]}
    >
      <Text style={[styles.emoji, !earned && { opacity: 0.5 }]}>{achievement.emoji}</Text>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {achievement.title}
      </Text>
      <Text style={[styles.body, { color: theme.textMuted }]} numberOfLines={2}>
        {achievement.description}
      </Text>
      <View style={[styles.rarityPill, { backgroundColor: rarityColor }]}>
        <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "flex-start",
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  body: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8,
    minHeight: 28,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  rarityText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});
