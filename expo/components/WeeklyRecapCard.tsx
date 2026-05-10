import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, CalendarRange, Flame, Sparkles } from "lucide-react-native";
import { WeeklyRecap, formatWeekRange, isSunday } from "@/lib/weekly-recap";
import { getTheme, radius, spacing } from "@/constants/colors";

interface Props {
  recap: WeeklyRecap;
  streak: number;
  theme: ReturnType<typeof getTheme>;
  onPress: () => void;
}

export default function WeeklyRecapCard({ recap, streak, theme, onPress }: Props) {
  const sundayMode = isSunday();
  const range = formatWeekRange(recap.weekStart, recap.weekEnd);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}
      testID="weekly-recap-card"
    >
      <LinearGradient
        colors={theme.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.head}>
          <View style={[styles.pill, { backgroundColor: theme.text }]}>
            {sundayMode ? (
              <Sparkles size={12} color={theme.background} />
            ) : (
              <CalendarRange size={12} color={theme.background} />
            )}
            <Text style={[styles.pillText, { color: theme.background }]}>
              {sundayMode ? "SUNDAY RECAP" : "THIS WEEK"}
            </Text>
          </View>
          <Text style={[styles.range, { color: theme.text }]}>{range}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {recap.daysLogged === 0
            ? "Your week starts now"
            : recap.daysLogged === 1
            ? "1 bed made this week"
            : `${recap.daysLogged} beds made this week`}
        </Text>
        <View style={styles.statsRow}>
          <Stat label="Best" value={recap.bestScore || "—"} theme={theme} />
          <Stat label="Avg" value={recap.avgScore || "—"} theme={theme} />
          <Stat label="Streak" value={streak} theme={theme} icon={<Flame size={12} color={theme.accent} fill={theme.accent} />} />
        </View>
        <View style={styles.cta}>
          <Text style={[styles.ctaText, { color: theme.text }]}>
            {recap.daysLogged === 0 ? "Make your first bed →" : "Open recap"}
          </Text>
          <ArrowUpRight size={16} color={theme.text} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function Stat({
  label,
  value,
  theme,
  icon,
}: {
  label: string;
  value: number | string;
  theme: ReturnType<typeof getTheme>;
  icon?: React.ReactNode;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: "rgba(255,255,255,0.55)" }]}>
      <View style={styles.statHead}>
        {icon}
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  gradient: {
    padding: spacing.lg,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  range: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    padding: 10,
    borderRadius: radius.md,
  },
  statHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
