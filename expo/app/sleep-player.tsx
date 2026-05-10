import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, Pause, Play, RotateCcw, RotateCw, Timer, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { formatDuration, getTrackById } from "@/constants/sleep-content";
import { tapLight, tapMedium } from "@/lib/haptics";

const TIMER_OPTIONS = [0, 5, 15, 30, 45, 60] as const;

export default function SleepPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const track = useMemo(() => (id ? getTrackById(id) : null), [id]);

  const player = useAudioPlayer(track ? { uri: track.audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [timerExpiresAt, setTimerExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const startedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!player || startedRef.current) return;
    startedRef.current = true;
    try {
      player.loop = true;
      player.play();
    } catch (e) {
      console.log("[sleep-player] auto-play error", e);
    }
  }, [player]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!timerExpiresAt) return;
    if (now >= timerExpiresAt) {
      try {
        player?.pause();
      } catch {}
      setTimerExpiresAt(null);
      setTimerMinutes(0);
    }
  }, [now, timerExpiresAt, player]);

  const handleClose = useCallback(() => {
    tapLight();
    try {
      player?.pause();
    } catch {}
    router.back();
  }, [player, router]);

  const handleTogglePlay = useCallback(() => {
    if (!player) return;
    tapMedium();
    if (status?.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status?.playing]);

  const handleSkip = useCallback(
    (delta: number) => {
      if (!player || !status) return;
      tapLight();
      const target = Math.max(0, Math.min((status.duration ?? 0) - 1, (status.currentTime ?? 0) + delta));
      try {
        player.seekTo(target);
      } catch (e) {
        console.log("[sleep-player] seek error", e);
      }
    },
    [player, status]
  );

  const handlePickTimer = useCallback(
    (mins: number) => {
      tapLight();
      setTimerMinutes(mins);
      if (mins === 0) {
        setTimerExpiresAt(null);
      } else {
        setTimerExpiresAt(Date.now() + mins * 60 * 1000);
      }
    },
    []
  );

  if (!track) {
    return (
      <View style={[styles.container, { backgroundColor: "#0E1024" }]}>
        <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
          <Text style={styles.fallback}>Track not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.fallbackBtn}>
            <Text style={styles.fallbackBtnText}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const duration = status?.duration ?? track.durationSec;
  const current = status?.currentTime ?? 0;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const remaining = timerExpiresAt ? Math.max(0, Math.ceil((timerExpiresAt - now) / 1000)) : 0;
  const remainingLabel = remaining > 0
    ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
    : null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: track.cover }} style={StyleSheet.absoluteFill} blurRadius={Platform.OS === "web" ? 12 : 24} />
      <LinearGradient
        colors={[track.gradient[0], "rgba(14,16,36,0.85)", "#0E1024"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.iconBtn} hitSlop={12} testID="player-close">
            <ChevronDown size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.topLabel}>Now playing</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.artWrap}>
          <Image source={{ uri: track.cover }} style={styles.art} />
        </View>

        <View style={styles.metaWrap}>
          <Text style={styles.title}>{track.title}</Text>
          <Text style={styles.subtitle}>{track.subtitle}</Text>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(current)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={() => handleSkip(-15)} style={styles.controlGhost} hitSlop={10} testID="skip-back">
            <RotateCcw size={22} color="#FFF" />
            <Text style={styles.controlGhostLabel}>15</Text>
          </Pressable>
          <Pressable
            onPress={handleTogglePlay}
            style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.85 : 1 }]}
            testID="play-toggle"
          >
            {status?.playing ? (
              <Pause size={28} color="#0E1024" fill="#0E1024" />
            ) : (
              <Play size={28} color="#0E1024" fill="#0E1024" />
            )}
          </Pressable>
          <Pressable onPress={() => handleSkip(15)} style={styles.controlGhost} hitSlop={10} testID="skip-fwd">
            <RotateCw size={22} color="#FFF" />
            <Text style={styles.controlGhostLabel}>15</Text>
          </Pressable>
        </View>

        <View style={styles.timerWrap}>
          <View style={styles.timerHeader}>
            <Timer size={14} color="#F5C97B" />
            <Text style={styles.timerLabel}>
              Sleep timer {remainingLabel ? `· ${remainingLabel}` : ""}
            </Text>
          </View>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((m) => (
              <Pressable
                key={m}
                onPress={() => handlePickTimer(m)}
                style={[styles.timerChip, timerMinutes === m && styles.timerChipActive]}
                testID={`timer-${m}`}
              >
                <Text style={[styles.timerChipText, timerMinutes === m && styles.timerChipTextActive]}>
                  {m === 0 ? "Off" : `${m}m`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <Pressable onPress={handleClose} style={styles.exitDot} hitSlop={20} testID="player-exit">
        <X size={16} color="rgba(255,255,255,0.6)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E1024" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  topLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  artWrap: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 28,
  },
  art: {
    width: 280,
    height: 280,
    borderRadius: 24,
  },
  metaWrap: {
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  progressWrap: {
    paddingHorizontal: 32,
    marginBottom: 18,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F5C97B",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginBottom: 32,
  },
  controlGhost: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
  },
  controlGhostLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F5C97B",
    alignItems: "center",
    justifyContent: "center",
  },
  timerWrap: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: "auto",
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  timerLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  timerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  timerChipActive: {
    backgroundColor: "#F5C97B",
    borderColor: "#F5C97B",
  },
  timerChipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
  },
  timerChipTextActive: {
    color: "#0E1024",
  },
  exitDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 60,
    height: 60,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallback: { color: "#FFF", fontSize: 16 },
  fallbackBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: "#F5C97B" },
  fallbackBtnText: { color: "#0E1024", fontWeight: "800" },
});
