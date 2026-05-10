import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Award, Calendar, Flame, Lock, Sparkles, TrendingUp } from "lucide-react-native";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import BedCard from "@/components/BedCard";
import AchievementCard from "@/components/AchievementCard";
import WeeklyRecapCard from "@/components/WeeklyRecapCard";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { SafeAreaView } from "react-native-safe-area-context";
import { tapLight } from "@/lib/haptics";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface DayCell {
  key: string;
  day: string;
  date: number;
  score: number | null;
  hasEntry: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export default function JournalScreen() {
  const router = useRouter();
  const { profile, entries, showPaywall, earnedAchievements } = useApp();
  const theme = getTheme(profile.theme);

  const heatmap = useMemo<DayCell[]>(() => {
    const days: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = entries.find((e) => e.date === key);
      days.push({
        key,
        day: DAY_LABELS[d.getDay()],
        date: d.getDate(),
        score: entry?.score ?? null,
        hasEntry: !!entry,
        isToday: i === 0,
        isFuture: false,
      });
    }
    return days;
  }, [entries]);

  const monthScores = useMemo(() => entries.slice(0, 30).map((e) => e.score), [entries]);
  const avgMonth = monthScores.length > 0 ? Math.round(monthScores.reduce((a, b) => a + b, 0) / monthScores.length) : 0;

  const bestEntry = useMemo(() => {
    if (entries.length === 0) return null;
    return [...entries].sort((a, b) => b.score - a.score)[0];
  }, [entries]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.textSubtle }]}>YOUR PROGRESS</Text>
        <Text style={[styles.header, { color: theme.text }]}>Journal</Text>

        <WeeklyRecapCard
          recap={buildWeeklyRecap(entries)}
          streak={profile.streak}
          theme={theme}
          onPress={() => { tapLight(); router.push("/recap"); }}
        />

        <View style={styles.streakWrap}>
          <View style={[styles.streakCard, { backgroundColor: theme.text, shadowColor: theme.shadow }]}>
            <View style={styles.streakHead}>
              <Flame size={18} color={theme.accent} fill={theme.accent} />
              <Text style={[styles.streakLabel, { color: theme.background }]}>CURRENT STREAK</Text>
            </View>
            <View style={styles.streakBody}>
              <Text style={[styles.streakNumber, { color: theme.background }]}>{profile.streak}</Text>
              <Text style={[styles.streakUnit, { color: theme.background }]}>day{profile.streak === 1 ? "" : "s"}</Text>
            </View>
            <Text style={[styles.streakBest, { color: theme.background }]}>Best: {profile.bestStreak} days</Text>
          </View>
          <View style={styles.miniStats}>
            <MiniStat label="This month" value={String(monthScores.length)} sub="entries" theme={theme} />
            <MiniStat label="Avg" value={String(avgMonth)} sub="bed score" theme={theme} />
          </View>
        </View>

        <View style={[styles.heatCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Last 28 days</Text>
          <View style={styles.heatGrid}>
            {heatmap.map((d) => {
              const tone = d.score == null
                ? theme.progressBackground
                : d.score >= 90
                ? theme.success
                : d.score >= 75
                ? theme.accent
                : d.score >= 60
                ? theme.accent2
                : theme.warning;
              return (
                <View
                  key={d.key}
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor: tone,
                      opacity: d.hasEntry ? 1 : 0.5,
                      borderWidth: d.isToday ? 2 : 0,
                      borderColor: theme.text,
                    },
                  ]}
                >
                  {d.hasEntry && d.score != null && (
                    <Text style={[styles.heatScore, { color: theme.isDark ? theme.background : "#FFF" }]}>{d.score}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <Legend color={theme.warning} label="0-60" theme={theme} />
            <Legend color={theme.accent2} label="60+" theme={theme} />
            <Legend color={theme.accent} label="75+" theme={theme} />
            <Legend color={theme.success} label="90+" theme={theme} />
          </View>
        </View>

        {profile.isPremium ? (
          <View style={[styles.insightsCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.insightHead}>
              <Sparkles size={16} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Insights</Text>
            </View>
            <Insight icon={<Calendar size={16} color={theme.text} />} text={`You've logged ${profile.totalBeds} bed${profile.totalBeds === 1 ? "" : "s"} total.`} theme={theme} />
            <Insight icon={<TrendingUp size={16} color={theme.text} />} text={`Your 30-day average is ${avgMonth}.`} theme={theme} />
            {bestEntry && (
              <Insight icon={<Flame size={16} color={theme.accent} />} text={`Your best score is ${bestEntry.score} — "${bestEntry.title}".`} theme={theme} />
            )}
          </View>
        ) : (
          <Pressable
            onPress={() => { tapLight(); showPaywall("insights"); }}
            style={({ pressed }) => [styles.lockedCard, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.92 : 1 }]}
            testID="locked-insights"
          >
            <View style={[styles.lockIcon, { backgroundColor: theme.accentSoft }]}>
              <Lock size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lockedTitle, { color: theme.text }]}>Insights & patterns</Text>
              <Text style={[styles.lockedBody, { color: theme.textMuted }]}>See trends, best days, and personal records.</Text>
            </View>
            <Text style={[styles.lockedCta, { color: theme.accent }]}>Unlock</Text>
          </Pressable>
        )}

        <View style={styles.achHeader}>
          <View style={styles.achHeaderLeft}>
            <Award size={16} color={theme.text} />
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Achievements</Text>
          </View>
          <Text style={[styles.historyCount, { color: theme.textSubtle }]}>
            {earnedAchievements.length}/{ALL_ACHIEVEMENTS.length}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achScroll}
        >
          {[...ALL_ACHIEVEMENTS]
            .sort((a, b) => {
              const ae = earnedAchievements.includes(a.id) ? 0 : 1;
              const be = earnedAchievements.includes(b.id) ? 0 : 1;
              return ae - be;
            })
            .map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                earned={earnedAchievements.includes(a.id)}
                theme={theme}
              />
            ))}
        </ScrollView>

        <View style={styles.historyHeader}>
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>History</Text>
          <Text style={[styles.historyCount, { color: theme.textSubtle }]}>{entries.length} entries</Text>
        </View>

        {entries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No entries yet</Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>Snap your first bed to start your journal.</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <BedCard
              key={entry.id}
              entry={entry}
              onPress={() => router.push({ pathname: "/(tabs)/(home)/result", params: { entryId: entry.id } })}
            />
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, sub, theme }: { label: string; value: string; sub: string; theme: ReturnType<typeof getTheme> }) {
  return (
    <View style={[styles.miniCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Text style={[styles.miniLabel, { color: theme.textSubtle }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.miniValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.miniSub, { color: theme.textMuted }]}>{sub}</Text>
    </View>
  );
}

function Legend({ color, label, theme }: { color: string; label: string; theme: ReturnType<typeof getTheme> }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function Insight({ icon, text, theme }: { icon: React.ReactNode; text: string; theme: ReturnType<typeof getTheme> }) {
  return (
    <View style={[styles.insightRow, { borderTopColor: theme.border }]}>
      <View style={{ width: 22, alignItems: "center" }}>{icon}</View>
      <Text style={[styles.insightText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: spacing.md,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: spacing.lg,
  },
  streakWrap: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.lg,
  },
  streakCard: {
    flex: 1.4,
    padding: 18,
    borderRadius: radius.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  streakHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    opacity: 0.7,
  },
  streakBody: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2,
  },
  streakUnit: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.7,
  },
  streakBest: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  miniStats: { flex: 1, gap: 10 },
  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 1,
    justifyContent: "center",
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  miniValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  miniSub: {
    fontSize: 10,
    fontWeight: "500",
  },
  heatCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  heatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  heatCell: {
    width: "12.6%",
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  heatScore: {
    fontSize: 9,
    fontWeight: "800",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  insightsCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
  },
  insightHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  lockIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  lockedBody: {
    fontSize: 12,
    marginTop: 2,
  },
  lockedCta: {
    fontSize: 13,
    fontWeight: "800",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  achHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  achHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  achScroll: {
    gap: 10,
    paddingRight: spacing.xl,
    paddingBottom: 4,
  },
  historyCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 13,
  },
});
