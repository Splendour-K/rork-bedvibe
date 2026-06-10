import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BedEntry, UserProfile } from "@/types";
import { ThemeName } from "@/constants/colors";
import { configureNotifications, scheduleDailyReminder, cancelDailyReminder, scheduleWakeAlarm, cancelAlarm, scheduleStreakWarning, cancelStreakWarning } from "@/lib/notifications";
import { notifyWarning } from "@/lib/haptics";
import { upsertRemoteProfile } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { AchievementId, computeEarnedAchievements, diffNewlyEarned } from "@/lib/achievements";

const STORAGE_KEY_ENTRIES = "bedvibe_entries_v2";
const STORAGE_KEY_PROFILE = "bedvibe_profile_v2";
const STORAGE_KEY_ACHIEVEMENTS = "bedvibe_achievements_v1";

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStartKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcWeeklyScore(entries: BedEntry[]): number {
  const start = getWeekStartKey();
  const week = entries.filter((e) => e.date >= start);
  if (week.length === 0) return 0;
  return Math.round(week.reduce((s, e) => s + e.score, 0) / week.length);
}

function calculateStreak(entries: BedEntry[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const latest = sorted[0].date;
  if (latest !== today && latest !== yKey) return 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const eKey = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`;
    if (sorted[i]?.date === eKey) streak++;
    else break;
  }
  return streak;
}

function genUserId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const defaultProfile: UserProfile = {
  name: "You",
  isPremium: true,
  theme: "linen",
  reminderEnabled: false,
  reminderTime: "08:00",
  streak: 0,
  bestStreak: 0,
  totalBeds: 0,
  avgScore: 0,
  userId: genUserId(),
  hasOnboarded: false,
  alarmEnabled: false,
  alarmTime: "07:00",
  alarmDays: [1, 2, 3, 4, 5],
  goals: [],
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [entries, setEntries] = useState<BedEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paywallVisible, setPaywallVisible] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<string | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<AchievementId[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<AchievementId[]>([]);
  const { userId: authUserId, isAuthenticated } = useAuth();
  const remoteUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    remoteUserIdRef.current = authUserId;
    console.log("[AppProvider] auth user", authUserId);
  }, [authUserId]);

  const hasTodayEntry = useMemo(() => {
    const today = getTodayKey();
    return entries.some((e) => e.date === today);
  }, [entries]);

  const todayEntry = useMemo(() => {
    const today = getTodayKey();
    return entries.find((e) => e.date === today) ?? null;
  }, [entries]);

  /** Schedule / cancel the streak-at-risk warning whenever streak or today entry changes */
  useEffect(() => {
    if (isLoading) return;
    const todayKey = getTodayKey();
    const hasToday = entries.some((e) => e.date === todayKey);
    if (!hasToday && profile.streak > 0 && profile.reminderEnabled) {
      scheduleStreakWarning(profile.streak).catch(() => {});
    } else if (hasToday) {
      cancelStreakWarning().catch(() => {});
    }
  }, [entries, profile.streak, profile.reminderEnabled, isLoading]);

  useEffect(() => {
    configureNotifications();
    const load = async (): Promise<void> => {
      try {
        const [entriesRaw, profileRaw, achRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ENTRIES),
          AsyncStorage.getItem(STORAGE_KEY_PROFILE),
          AsyncStorage.getItem(STORAGE_KEY_ACHIEVEMENTS),
        ]);
        if (entriesRaw) setEntries(JSON.parse(entriesRaw));
        if (achRaw) setEarnedAchievements(JSON.parse(achRaw));
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw) as Partial<UserProfile>;
          const validThemes: ThemeName[] = ["linen", "midnight", "sunrise", "pirate"];
          const theme: ThemeName = parsed.theme && validThemes.includes(parsed.theme as ThemeName)
            ? (parsed.theme as ThemeName)
            : "linen";
          setProfile({ ...defaultProfile, ...parsed, theme, userId: parsed.userId ?? defaultProfile.userId });
        }
      } catch (e) {
        console.log("[AppProvider] load error", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const persistEntries = useCallback(async (newEntries: BedEntry[]): Promise<void> => {
    setEntries(newEntries);
    await AsyncStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(newEntries));
  }, []);

  const persistProfile = useCallback(async (newProfile: UserProfile, weeklyScore?: number): Promise<void> => {
    setProfile(newProfile);
    await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(newProfile));
    const remoteId = remoteUserIdRef.current;
    if (remoteId && isAuthenticated) {
      upsertRemoteProfile({
        user_id: remoteId,
        name: newProfile.name,
        is_premium: newProfile.isPremium,
        avg_score: newProfile.avgScore,
        streak: newProfile.streak,
        best_streak: newProfile.bestStreak,
        total_beds: newProfile.totalBeds,
        weekly_score: weeklyScore ?? newProfile.avgScore,
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const addEntry = useCallback(
    async (entry: BedEntry): Promise<void> => {
      const updated = [entry, ...entries.filter((e) => e.date !== entry.date)];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      const streak = calculateStreak(updated);
      const avgScore = updated.length > 0 ? Math.round(updated.reduce((s, e) => s + e.score, 0) / updated.length) : 0;
      const weeklyScore = calcWeeklyScore(updated);
      const newProfile: UserProfile = {
        ...profile,
        streak,
        bestStreak: Math.max(profile.bestStreak, streak),
        totalBeds: updated.length,
        avgScore,
      };
      await persistEntries(updated);
      await persistProfile(newProfile, weeklyScore);
      // User uploaded today — cancel the streak-at-risk evening reminder
      cancelStreakWarning().catch(() => {});

      const nextEarned = computeEarnedAchievements(updated, newProfile);
      const newly = diffNewlyEarned(earnedAchievements, nextEarned);
      if (newly.length > 0) {
        setEarnedAchievements(nextEarned);
        setPendingAchievements((prev) => [...prev, ...newly]);
        AsyncStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(nextEarned)).catch(() => {});
      }
    },
    [entries, profile, persistEntries, persistProfile, earnedAchievements]
  );

  const consumePendingAchievements = useCallback((): AchievementId[] => {
    const list = pendingAchievements;
    if (list.length === 0) return [];
    setPendingAchievements([]);
    return list;
  }, [pendingAchievements]);

  const updateProfile = useCallback(
    async (partial: Partial<UserProfile>): Promise<void> => {
      const updated: UserProfile = { ...profile, ...partial };
      await persistProfile(updated);
    },
    [profile, persistProfile]
  );

  const showPaywall = useCallback((reason?: string): void => {
    notifyWarning();
    setPaywallReason(reason ?? null);
    setPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback((): void => {
    setPaywallVisible(false);
    setPaywallReason(null);
  }, []);

  const setAlarm = useCallback(
    async (enabled: boolean, time?: string, days?: number[]): Promise<boolean> => {
      const nextTime = time ?? profile.alarmTime;
      const nextDays = days ?? profile.alarmDays;
      if (enabled) {
        const ok = await scheduleWakeAlarm(nextTime, nextDays);
        await updateProfile({ alarmEnabled: ok, alarmTime: nextTime, alarmDays: nextDays });
        return ok;
      } else {
        await cancelAlarm();
        await updateProfile({ alarmEnabled: false, alarmTime: nextTime, alarmDays: nextDays });
        return true;
      }
    },
    [profile.alarmTime, profile.alarmDays, updateProfile]
  );

  const setReminder = useCallback(
    async (enabled: boolean, time?: string): Promise<boolean> => {
      const nextTime = time ?? profile.reminderTime;
      if (enabled) {
        const ok = await scheduleDailyReminder(nextTime);
        await updateProfile({ reminderEnabled: ok, reminderTime: nextTime });
        return ok;
      } else {
        await cancelDailyReminder();
        await updateProfile({ reminderEnabled: false, reminderTime: nextTime });
        return true;
      }
    },
    [profile.reminderTime, updateProfile]
  );

  return useMemo(
    () => ({
      entries,
      profile,
      isLoading,
      hasTodayEntry,
      todayEntry,
      addEntry,
      updateProfile,
      paywallVisible,
      paywallReason,
      showPaywall,
      hidePaywall,
      setReminder,
      setAlarm,
      getTodayKey,
      earnedAchievements,
      pendingAchievements,
      consumePendingAchievements,
    }),
    [entries, profile, isLoading, hasTodayEntry, todayEntry, addEntry, updateProfile, paywallVisible, paywallReason, showPaywall, hidePaywall, setReminder, setAlarm, earnedAchievements, pendingAchievements, consumePendingAchievements]
  );
});
