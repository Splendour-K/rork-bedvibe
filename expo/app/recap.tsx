import React, { useMemo, useRef } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { CalendarRange, Flame, Share2, Sparkles, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { Platform } from "react-native";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { buildWeeklyRecap, formatWeekRange, isSunday } from "@/lib/weekly-recap";
import { tapLight, tapMedium } from "@/lib/haptics";

export default function RecapScreen() {
  const router = useRouter();
  const { entries, profile } = useApp();
  const theme = getTheme(profile.theme);
  const recap = useMemo(() => buildWeeklyRecap(entries), [entries]);
  const cardRef = useRef<View | null>(null);

  const handleShare = async (): Promise<void> => {
    tapMedium();
    const message = `My BedVibe week: ${recap.daysLogged} beds made, best score ${recap.bestScore || "—"}, average ${recap.avgScore || "—"}.`;
    if (Platform.OS === "web" || !cardRef.current) {
      try { await Share.share({ message }); } catch {}
      return;
    }
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      await Share.share({ url: uri, message });
    } catch {
      try { await Share.share({ message }); } catch {}
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => { tapLight(); router.back(); }} style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]} testID="recap-close">
            <X size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.topTitle, { color: theme.text }]}>Weekly Recap</Text>
          <Pressable onPress={handleShare} style={[styles.iconBtn, { backgroundColor: theme.text }]} testID="recap-share">
            <Share2 size={18} color={theme.background} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View ref={cardRef} collapsable={false} style={styles.cardWrap}>
            <LinearGradient
              colors={theme.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardHead}>
                <View style={[styles.brandPill, { backgroundColor: theme.text }]}>
                  {isSunday() ? (
                    <Sparkles size={12} color={theme.background} />
                  ) : (
                    <CalendarRange size={12} color={theme.background} />
                  )}
                  <Text style={[styles.brandText, { color: theme.background }]}>BedVibe · Recap</Text>
                </View>
                <Text style={[styles.range, { color: theme.text }]}>
                  {formatWeekRange(recap.weekStart, recap.weekEnd)}
                </Text>
              </View>

              <Text style={[styles.bigStat, { color: theme.text }]}>{recap.daysLogged}</Text>
              <Text style={[styles.bigLabel, { color: theme.textMuted }]}>
                bed{recap.daysLogged === 1 ? "" : "s"} made this week
              </Text>

              <View style={styles.statsGrid}>
                <BigStat label="Best score" value={recap.bestScore || "—"} theme={theme} />
                <BigStat label="Avg score" value={recap.avgScore || "—"} theme={theme} />
                <BigStat
                  label="Streak"
                  value={profile.streak}
                  theme={theme}
                  icon={<Flame size={14} color={theme.accent} fill={theme.accent} />}
                />
              </View>

              {recap.bestTitle && (
                <View style={[styles.callout, { backgroundColor: "rgba(255,255,255,0.55)" }]}>
                  <Text style={[styles.calloutLabel, { color: theme.textMuted }]}>FUNNIEST TITLE EARNED</Text>
                  <Text style={[styles.calloutValue, { color: theme.text }]}>{recap.bestTitle}</Text>
                </View>
              )}

              <Text style={[styles.tagline, { color: theme.textMuted }]}>
                {recap.daysLogged >= 5
                  ? "You showed up. That's the whole game."
                  : recap.daysLogged > 0
                  ? "A start is a streak. Keep it going next week."
                  : "Tomorrow morning is a fresh start. We'll be here."}
              </Text>
            </LinearGradient>
          </View>

          {recap.entries.length > 0 && (
            <View style={[styles.entriesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.entriesTitle, { color: theme.text }]}>Days this week</Text>
              {recap.entries
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => (
                  <View key={e.id} style={[styles.entryRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.entryDate, { color: theme.textMuted }]}>{e.date}</Text>
                    <Text style={[styles.entryTitle, { color: theme.text }]} numberOfLines={1}>{e.title}</Text>
                    <Text style={[styles.entryScore, { color: theme.text }]}>{e.score}</Text>
                  </View>
                ))}
            </View>
          )}

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.shareBtn, { backgroundColor: theme.text, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            testID="recap-share-cta"
          >
            <Share2 size={18} color={theme.background} />
            <Text style={[styles.shareBtnText, { color: theme.background }]}>Share this recap</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function BigStat({
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
    <View style={[styles.bsCard, { backgroundColor: "rgba(255,255,255,0.6)" }]}>
      <View style={styles.bsHead}>
        {icon}
        <Text style={[styles.bsLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
      </View>
      <Text style={[styles.bsValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  topTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 32 },
  cardWrap: { borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.lg },
  card: { padding: spacing.xl, minHeight: 460 },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  brandText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  range: { fontSize: 12, fontWeight: "700", opacity: 0.8 },
  bigStat: { fontSize: 96, fontWeight: "800", letterSpacing: -3, lineHeight: 96 },
  bigLabel: { fontSize: 14, fontWeight: "600", marginTop: 4, marginBottom: spacing.lg },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: spacing.lg },
  bsCard: { flex: 1, padding: 12, borderRadius: radius.md },
  bsHead: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  bsLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  bsValue: { fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
  callout: { padding: 12, borderRadius: radius.md, marginBottom: spacing.md },
  calloutLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.7, marginBottom: 4 },
  calloutValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  tagline: { fontSize: 13, fontWeight: "500", lineHeight: 18, marginTop: 4 },
  entriesCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.lg },
  entriesTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  entryDate: { fontSize: 12, fontWeight: "600", width: 90 },
  entryTitle: { flex: 1, fontSize: 13, fontWeight: "700" },
  entryScore: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  shareBtnText: { fontSize: 15, fontWeight: "800" },
});
