import React, { useCallback, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Crown, Headphones, Lock, Moon, Play, Sparkles, Wind } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { tapLight, tapMedium } from "@/lib/haptics";
import { AMBIENT, formatDuration, SleepTrack, STORIES, tonightsStory } from "@/constants/sleep-content";

export default function SleepScreen() {
  const router = useRouter();
  const { profile, showPaywall } = useApp();
  const theme = getTheme(profile.theme);
  const tonight = useMemo(() => tonightsStory(), []);

  const handleOpen = useCallback(
    (track: SleepTrack) => {
      const locked = !profile.isPremium && !track.freePreview;
      if (locked) {
        tapLight();
        showPaywall(`sleep:${track.id}`);
        return;
      }
      tapMedium();
      router.push({ pathname: "/sleep-player", params: { id: track.id } });
    },
    [profile.isPremium, router, showPaywall]
  );

  return (
    <View style={[styles.container, { backgroundColor: "#0E1024" }]}>
      <LinearGradient
        colors={["#1B1F3B", "#0E1024", "#0E1024"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>NIGHT ROUTINE</Text>
              <Text style={styles.header}>Sleep</Text>
            </View>
            <View style={styles.moonBadge}>
              <Moon size={20} color="#F5C97B" />
            </View>
          </View>

          <Pressable
            onPress={() => handleOpen(tonight)}
            style={({ pressed }) => [styles.tonightCard, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}
            testID="tonights-story"
          >
            <Image source={{ uri: tonight.cover }} style={StyleSheet.absoluteFill} blurRadius={4} />
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.tonightBody}>
              <View style={styles.tonightTopRow}>
                <View style={styles.tonightPill}>
                  <Sparkles size={11} color="#F5C97B" />
                  <Text style={styles.tonightPillText}>TONIGHT'S STORY</Text>
                </View>
                {!profile.isPremium && !tonight.freePreview && (
                  <View style={styles.lockPill}>
                    <Lock size={11} color="#F5C97B" />
                    <Text style={styles.lockPillText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tonightTitle}>{tonight.title}</Text>
              <Text style={styles.tonightSubtitle}>{tonight.subtitle}</Text>
              <View style={styles.tonightCtaRow}>
                <View style={styles.tonightCta}>
                  <Play size={14} color="#0E1024" fill="#0E1024" />
                  <Text style={styles.tonightCtaText}>Play · {formatDuration(tonight.durationSec)}</Text>
                </View>
              </View>
            </View>
          </Pressable>

          {!profile.isPremium && (
            <Pressable
              onPress={() => { tapLight(); showPaywall("sleep"); }}
              style={({ pressed }) => [styles.upgradeBanner, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}
              testID="sleep-upgrade"
            >
              <View style={styles.upgradeIcon}>
                <Crown size={18} color="#F5C97B" fill="#F5C97B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Unlock the full Sleep library</Text>
                <Text style={styles.upgradeBody}>Stories, ambient sounds, breathing.</Text>
              </View>
              <Text style={styles.upgradeCta}>Try free</Text>
            </Pressable>
          )}

          <SectionHeader icon={<Headphones size={16} color="#F5C97B" />} title="Bedtime Stories" />
          <View style={styles.grid}>
            {STORIES.map((t) => (
              <TrackCard
                key={t.id}
                track={t}
                locked={!profile.isPremium && !t.freePreview}
                onPress={() => handleOpen(t)}
              />
            ))}
          </View>

          <SectionHeader icon={<Wind size={16} color="#8FA8FF" />} title="Relaxation & Ambience" />
          <View style={styles.grid}>
            {AMBIENT.map((t) => (
              <TrackCard
                key={t.id}
                track={t}
                locked={!profile.isPremium && !t.freePreview}
                onPress={() => handleOpen(t)}
              />
            ))}
          </View>

          <Text style={styles.footnote}>
            Made for falling asleep. Tracks loop until you stop them.
          </Text>
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>{icon}</View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

interface TrackCardProps {
  track: SleepTrack;
  locked: boolean;
  onPress: () => void;
}

function TrackCard({ track, locked, onPress }: TrackCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      testID={`track-${track.id}`}
    >
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: track.cover }} style={styles.cardImage} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
          style={StyleSheet.absoluteFill}
        />
        {locked ? (
          <View style={styles.cardLock}>
            <Lock size={14} color="#FFF" />
          </View>
        ) : (
          <View style={styles.cardPlay}>
            <Play size={14} color="#0E1024" fill="#0E1024" />
          </View>
        )}
        <Text style={styles.cardDuration}>{formatDuration(track.durationSec)}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{track.title}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>{track.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 40 },
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
  tonightCard: {
    height: 220,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    backgroundColor: "#1B1F3B",
  },
  tonightBody: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  tonightTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    alignSelf: "flex-start",
  },
  tonightPillText: {
    color: "#F5C97B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  lockPill: {
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
  lockPillText: {
    color: "#F5C97B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tonightTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 8,
  },
  tonightSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    marginTop: 4,
  },
  tonightCtaRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  tonightCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: "#F5C97B",
  },
  tonightCtaText: {
    color: "#0E1024",
    fontSize: 13,
    fontWeight: "800",
  },
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: "rgba(245,201,123,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,201,123,0.25)",
    marginBottom: spacing.lg,
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245,201,123,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    color: "#F4EFE3",
    fontSize: 14,
    fontWeight: "800",
  },
  upgradeBody: {
    color: "#A9A8C4",
    fontSize: 12,
    marginTop: 2,
  },
  upgradeCta: {
    color: "#F5C97B",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#F4EFE3",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.lg,
  },
  card: {
    width: "47%",
  },
  cardImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#1B1F3B",
    marginBottom: 8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardLock: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardPlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5C97B",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDuration: {
    position: "absolute",
    bottom: 12,
    right: 12,
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  cardTitle: {
    color: "#F4EFE3",
    fontSize: 14,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#A9A8C4",
    fontSize: 11,
    marginTop: 2,
  },
  footnote: {
    color: "#6E6E92",
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
