import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, Lock, Medal, Trophy } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { fetchLeaderboard, LeaderboardWindow, rankBy } from "@/lib/leaderboard";
import { LeaderboardUser } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { tapLight } from "@/lib/haptics";

export default function LeaderboardScreen() {
  const { profile, showPaywall } = useApp();
  const theme = getTheme(profile.theme);
  const [windowFilter, setWindowFilter] = useState<LeaderboardWindow>("week");

  const myEntry: LeaderboardUser = useMemo(
    () => ({
      id: profile.userId,
      name: profile.name,
      avatar: "",
      streak: profile.streak,
      avgScore: profile.avgScore,
      weeklyScore: profile.avgScore,
      isPremium: profile.isPremium,
    }),
    [profile]
  );

  const query = useQuery({
    queryKey: ["leaderboard", windowFilter, profile.userId, profile.isPremium, profile.avgScore, profile.streak],
    queryFn: () => fetchLeaderboard(windowFilter, profile.isPremium ? myEntry : null),
  });

  const ranked = useMemo(() => {
    if (!query.data) return [];
    return rankBy(windowFilter, query.data);
  }, [query.data, windowFilter]);

  const myRank = useMemo(() => {
    if (!profile.isPremium) return null;
    const idx = ranked.findIndex((u) => u.id === profile.userId);
    return idx >= 0 ? idx + 1 : null;
  }, [ranked, profile]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 50);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => { tapLight(); query.refetch(); }}
            tintColor={theme.text}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: theme.textSubtle }]}>WORLDWIDE</Text>
        <Text style={[styles.header, { color: theme.text }]}>Leaderboard</Text>

        <View style={[styles.filterRow, { backgroundColor: theme.surfaceAlt }]}>
          <FilterChip
            label="This week"
            active={windowFilter === "week"}
            onPress={() => { tapLight(); setWindowFilter("week"); }}
            theme={theme}
          />
          <FilterChip
            label="All time"
            active={windowFilter === "all"}
            onPress={() => { tapLight(); setWindowFilter("all"); }}
            theme={theme}
          />
        </View>

        {!profile.isPremium && (
          <Pressable
            onPress={() => { tapLight(); showPaywall("leaderboard"); }}
            style={({ pressed }) => [
              styles.upgradeCard,
              { backgroundColor: theme.text, transform: [{ scale: pressed ? 0.99 : 1 }] },
            ]}
            testID="upgrade-leaderboard"
          >
            <View style={[styles.upgradeIcon, { backgroundColor: theme.accent }]}>
              <Trophy size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: theme.background }]}>Join the global board</Text>
              <Text style={[styles.upgradeBody, { color: theme.background, opacity: 0.7 }]}>
                Premium members appear with their score, streak and crown.
              </Text>
            </View>
            <Text style={[styles.upgradeCta, { color: theme.accent }]}>Go Pro</Text>
          </Pressable>
        )}

        {top3.length >= 3 && (
          <View style={styles.podium}>
            <PodiumCard place={2} user={top3[1]} theme={theme} windowFilter={windowFilter} isMe={top3[1].id === profile.userId} />
            <PodiumCard place={1} user={top3[0]} theme={theme} windowFilter={windowFilter} isMe={top3[0].id === profile.userId} />
            <PodiumCard place={3} user={top3[2]} theme={theme} windowFilter={windowFilter} isMe={top3[2].id === profile.userId} />
          </View>
        )}

        {query.isLoading && (
          <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={`sk-${i}`}
                style={[
                  styles.row,
                  {
                    borderBottomColor: theme.border,
                    borderBottomWidth: i < 5 ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <View style={[styles.skel, { width: 18, height: 12, backgroundColor: theme.surfaceAlt }]} />
                <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]} />
                <View style={{ flex: 1 }}>
                  <View style={[styles.skel, { width: "55%", height: 12, backgroundColor: theme.surfaceAlt, marginBottom: 6 }]} />
                  <View style={[styles.skel, { width: "35%", height: 10, backgroundColor: theme.surfaceAlt }]} />
                </View>
                <View style={[styles.skel, { width: 32, height: 16, backgroundColor: theme.surfaceAlt }]} />
              </View>
            ))}
          </View>
        )}

        {!query.isLoading && rest.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Trophy size={28} color={theme.textSubtle} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>The board is quiet</Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>Pull down to refresh and check again in a moment.</Text>
          </View>
        )}

        {!query.isLoading && rest.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          {rest.map((user, idx) => {
            const rank = idx + 4;
            const isMe = user.id === profile.userId;
            const score = windowFilter === "week" ? user.weeklyScore ?? user.avgScore : user.avgScore;
            return (
              <View
                key={user.id}
                style={[
                  styles.row,
                  {
                    backgroundColor: isMe ? theme.accentSoft : "transparent",
                    borderBottomColor: theme.border,
                    borderBottomWidth: idx < rest.length - 1 ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <Text style={[styles.rank, { color: theme.textSubtle }]}>{rank}</Text>
                <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.avatarText, { color: theme.text }]}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.text }]}>
                      {user.name}{isMe ? " · You" : ""}
                    </Text>
                    {user.isPremium && <Crown size={11} color={theme.accent} fill={theme.accent} />}
                  </View>
                  <Text style={[styles.subline, { color: theme.textMuted }]}>{user.streak}d streak</Text>
                </View>
                <Text style={[styles.scoreText, { color: theme.text }]}>{score}</Text>
              </View>
            );
          })}
        </View>
        )}

        {profile.isPremium && myRank && myRank > 50 && (
          <View style={[styles.myRow, { backgroundColor: theme.text }]}>
            <Text style={[styles.rank, { color: theme.background }]}>#{myRank}</Text>
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Text style={[styles.avatarText, { color: "#FFF" }]}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.background }]}>{profile.name} · You</Text>
              <Text style={[styles.subline, { color: theme.background, opacity: 0.7 }]}>Keep going to climb!</Text>
            </View>
            <Text style={[styles.scoreText, { color: theme.accent }]}>{profile.avgScore}</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, theme }: { label: string; active: boolean; onPress: () => void; theme: ReturnType<typeof getTheme> }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        { backgroundColor: active ? theme.text : "transparent" },
      ]}
    >
      <Text style={[styles.filterText, { color: active ? theme.background : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

interface PodiumCardProps {
  place: 1 | 2 | 3;
  user: LeaderboardUser;
  theme: ReturnType<typeof getTheme>;
  windowFilter: LeaderboardWindow;
  isMe: boolean;
}

function PodiumCard({ place, user, theme, windowFilter, isMe }: PodiumCardProps) {
  const score = windowFilter === "week" ? user.weeklyScore ?? user.avgScore : user.avgScore;
  const heights = { 1: 168, 2: 138, 3: 120 } as const;
  const Icon = place === 1 ? Crown : Medal;
  const iconColor = place === 1 ? "#F5C97B" : place === 2 ? "#D9D9D9" : "#E0A276";
  const gradient: readonly [string, string] = place === 1
    ? [theme.accent, theme.text] as const
    : place === 2
    ? [theme.accent2, theme.text] as const
    : [theme.warning, theme.text] as const;

  return (
    <View style={[styles.podiumCol, { height: heights[place] + 70 }]}>
      <View style={[styles.podiumIconWrap, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Icon size={20} color={iconColor} fill={iconColor} />
      </View>
      <View style={[styles.podiumAvatar, { backgroundColor: theme.surfaceAlt, borderColor: place === 1 ? theme.accent : theme.border }]}>
        <Text style={[styles.podiumAvatarText, { color: theme.text }]}>{user.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={[styles.podiumName, { color: theme.text }]} numberOfLines={1}>
        {user.name}{isMe ? " (You)" : ""}
      </Text>
      <Text style={[styles.podiumScore, { color: theme.text }]}>{score}</Text>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.podiumBlock, { height: heights[place] }]}
      >
        <Text style={styles.podiumPlace}>{place}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
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
  filterRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  upgradeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  upgradeBody: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  upgradeCta: {
    fontSize: 13,
    fontWeight: "800",
  },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  podiumCol: {
    flex: 1,
    alignItems: "center",
  },
  podiumIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 6,
  },
  podiumAvatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "700",
    maxWidth: "100%",
  },
  podiumScore: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  podiumBlock: {
    width: "100%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumPlace: {
    color: "#FFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    opacity: 0.9,
  },
  listCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rank: {
    width: 28,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
  },
  subline: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  scoreText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  myRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.xl,
    marginTop: spacing.md,
  },
  skel: {
    borderRadius: 6,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 13,
    textAlign: "center",
  },
});
