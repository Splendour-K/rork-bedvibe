import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, ArrowUpRight, Camera, Flame, Lock, Moon, Sparkles } from "lucide-react-native";
import { tonightsStory, formatDuration } from "@/constants/sleep-content";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { tapLight, tapMedium } from "@/lib/haptics";

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Sweet night";
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, hasTodayEntry, todayEntry, entries, showPaywall } = useApp();
  const tonight = tonightsStory();
  const theme = getTheme(profile.theme);
  const greeting = greetingFor(new Date());

  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  const handleSnap = useCallback(() => {
    tapMedium();
    router.push("/(tabs)/(home)/camera");
  }, [router]);

  const handleViewResult = useCallback(() => {
    if (todayEntry) {
      router.push({ pathname: "/(tabs)/(home)/result", params: { entryId: todayEntry.id } });
    }
  }, [router, todayEntry]);

  const heroTranslate = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroTranslate }] }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: theme.textSubtle }]}>{greeting.toUpperCase()}</Text>
              <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
            </View>
            {profile.streak > 0 && (
              <View style={[styles.streakPill, { backgroundColor: theme.accentSoft }]}>
                <Flame size={14} color={theme.accent} fill={theme.accent} />
                <Text style={[styles.streakText, { color: theme.accent }]}>{profile.streak} day{profile.streak === 1 ? "" : "s"}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Streak-at-risk warning: show when user has a streak but hasn't uploaded today */}
        {!hasTodayEntry && profile.streak > 0 && (
          <Pressable
            onPress={handleSnap}
            style={({ pressed }) => [
              styles.streakWarnCard,
              { transform: [{ scale: pressed ? 0.99 : 1 }] },
            ]}
          >
            <View style={styles.streakWarnLeft}>
              <View style={styles.streakWarnIconWrap}>
                <AlertTriangle size={18} color="#FF6B35" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakWarnTitle}>
                  🔥 {profile.streak}-day streak at risk!
                </Text>
                <Text style={styles.streakWarnBody}>
                  No photo today yet. Skip it and your streak resets to zero.
                </Text>
              </View>
            </View>
            <View style={styles.streakWarnCta}>
              <Text style={styles.streakWarnCtaText}>Snap now</Text>
              <ArrowUpRight size={14} color="#FF6B35" />
            </View>
          </Pressable>
        )}

        <Pressable
          onPress={handleSnap}
          style={({ pressed }) => [
            styles.snapCard,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          testID="snap-button"
        >
          <LinearGradient
            colors={theme.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.snapGradient}
          >
            <View style={styles.snapHeaderRow}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={[styles.snapEyebrow, { color: theme.textMuted }]}>TODAY'S RITUAL</Text>
                <Text style={[styles.snapTitle, { color: theme.text }]}>Snap your bed.</Text>
                <Text style={[styles.snapTitle, { color: theme.text }]}>Keep the streak alive.</Text>
              </View>
              <View style={[styles.snapIcon, { backgroundColor: theme.text }]}> 
                <Camera size={22} color={theme.background} />
              </View>
            </View>
            <Text style={[styles.snapBody, { color: theme.textMuted }]}> 
              {hasTodayEntry
                ? "Already logged today? Take another photo anytime to refresh your score."
                : "Snap a photo to get your daily Bed Score, title and an affirmation."}
            </Text>
            <View style={[styles.snapCta, { backgroundColor: theme.text }]}> 
              <Text style={[styles.snapCtaText, { color: theme.background }]}>Snap your bed</Text>
              <ArrowUpRight size={18} color={theme.background} />
            </View>
          </LinearGradient>
        </Pressable>

        {hasTodayEntry && todayEntry && (
          <Pressable
            onPress={handleViewResult}
            style={({ pressed }) => [styles.heroCard, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}
            testID="today-result"
          >
            <Image source={{ uri: todayEntry.imageUri }} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroPill}>
                  <Sparkles size={12} color="#FFF" />
                  <Text style={styles.heroPillText}>LATEST · {todayEntry.score}</Text>
                </View>
                <View style={styles.heroOpenBtn}>
                  <ArrowUpRight size={18} color="#FFF" />
                </View>
              </View>
              <View>
                <Text style={styles.heroKicker}>Most recent analysis</Text>
                <Text style={styles.heroTitle}>{todayEntry.title}</Text>
                <Text style={styles.heroAffirm} numberOfLines={2}>{todayEntry.affirmation}</Text>
              </View>
            </View>
          </Pressable>
        )}
        <View style={styles.statsRow}>
          <Stat label="Beds" value={String(profile.totalBeds)} theme={theme} />
          <Stat label="Best streak" value={String(profile.bestStreak)} theme={theme} />
          <Stat label="Avg" value={String(profile.avgScore)} theme={theme} accent />
        </View>

        <Pressable
          onPress={() => {
            const locked = !profile.isPremium && !tonight.freePreview;
            if (locked) { tapLight(); showPaywall(`sleep:${tonight.id}`); return; }
            tapMedium();
            router.push({ pathname: "/sleep-player", params: { id: tonight.id } });
          }}
          style={({ pressed }) => [
            styles.tonightCard,
            { backgroundColor: "#1B1F3B", transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
          testID="home-tonight-story"
        >
          <Image source={{ uri: tonight.cover }} style={StyleSheet.absoluteFill} blurRadius={3} />
          <LinearGradient
            colors={["rgba(14,16,36,0.55)", "rgba(14,16,36,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tonightTopRow}>
            <View style={styles.tonightPill}>
              <Moon size={11} color="#F5C97B" />
              <Text style={styles.tonightPillText}>TONIGHT'S STORY</Text>
            </View>
            {!profile.isPremium && !tonight.freePreview ? (
              <View style={styles.tonightLock}>
                <Lock size={11} color="#F5C97B" />
                <Text style={styles.tonightLockText}>Premium</Text>
              </View>
            ) : (
              <View style={styles.tonightArrow}>
                <ArrowUpRight size={16} color="#FFF" />
              </View>
            )}
          </View>
          <View style={styles.tonightBottom}>
            <Text style={styles.tonightTitle}>{tonight.title}</Text>
            <Text style={styles.tonightSub} numberOfLines={1}>{tonight.subtitle} · {formatDuration(tonight.durationSec)}</Text>
          </View>
        </Pressable>

        {entries.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent</Text>
              <Pressable onPress={() => router.push("/(tabs)/journal")}>
                <Text style={[styles.sectionLink, { color: theme.accent }]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {entries.slice(0, 8).map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push({ pathname: "/(tabs)/(home)/result", params: { entryId: entry.id } })}
                  style={({ pressed }) => [
                    styles.recentItem,
                    { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow, opacity: pressed ? 0.92 : 1 },
                  ]}
                >
                  <Image source={{ uri: entry.imageUri }} style={styles.recentImage} />
                  <View style={styles.recentBody}>
                    <Text style={[styles.recentScore, { color: theme.text }]}>{entry.score}</Text>
                    <Text style={[styles.recentTitle, { color: theme.textMuted }]} numberOfLines={1}>{entry.title}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, theme, accent }: { label: string; value: string; theme: ReturnType<typeof getTheme>; accent?: boolean }) {
  return (
    <View style={[styles.statCard, { backgroundColor: accent ? theme.text : theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Text style={[styles.statValue, { color: accent ? theme.background : theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: accent ? theme.background : theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 100 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  snapCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  snapGradient: {
    padding: spacing.xl,
    minHeight: 236,
    justifyContent: "space-between",
  },
  snapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  snapEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  snapTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 32,
  },
  snapIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  snapBody: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: spacing.lg,
    maxWidth: 280,
  },
  snapCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  snapCtaText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  heroCard: {
    height: 240,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    backgroundColor: "#000",
  },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  heroContent: {
    position: "absolute",
    inset: 0 as unknown as number,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  heroPillText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroOpenBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroKicker: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroAffirm: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  recentScroll: {
    gap: 12,
    paddingRight: spacing.xl,
  },
  recentItem: {
    width: 150,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 1,
  },
  recentImage: {
    width: "100%",
    height: 120,
  },
  recentBody: {
    padding: 12,
  },
  recentScore: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  tonightCard: {
    height: 140,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  tonightTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tonightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(245,201,123,0.18)",
    borderWidth: 1,
    borderColor: "rgba(245,201,123,0.3)",
  },
  tonightPillText: {
    color: "#F5C97B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tonightLock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(245,201,123,0.3)",
  },
  tonightLockText: {
    color: "#F5C97B",
    fontSize: 10,
    fontWeight: "800",
  },
  tonightArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  tonightBottom: {},
  tonightTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tonightSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
  },

  /* Streak-at-risk warning */
  streakWarnCard: {
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,107,53,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.30)",
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 10,
  },
  streakWarnLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  streakWarnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakWarnTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: "#FF6B35",
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  streakWarnBody: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,107,53,0.80)",
  },
  streakWarnCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
  },
  streakWarnCtaText: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: "#FF6B35",
  },
});
