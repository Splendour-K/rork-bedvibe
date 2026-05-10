import { BedEntry, UserProfile } from "@/types";

export type AchievementId =
  | "first_bed"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "perfect_vibe"
  | "early_bird"
  | "comeback"
  | "weekend_warrior"
  | "ten_beds"
  | "fifty_beds";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_bed", title: "First Bed", description: "You snapped your very first bed.", emoji: "🛏️", rarity: "common" },
  { id: "streak_3", title: "Streak Spark", description: "3 days in a row. The vibe begins.", emoji: "✨", rarity: "common" },
  { id: "streak_7", title: "Week Warrior", description: "Seven days. A true bed-making habit.", emoji: "🔥", rarity: "rare" },
  { id: "streak_30", title: "Month Master", description: "30 days of bed-making zen.", emoji: "👑", rarity: "legendary" },
  { id: "perfect_vibe", title: "Perfect Vibe", description: "Scored 95 or higher.", emoji: "💎", rarity: "epic" },
  { id: "early_bird", title: "Early Bird", description: "Snapped a bed before 8 AM.", emoji: "🌅", rarity: "common" },
  { id: "comeback", title: "Comeback Kid", description: "Returned after a break. Welcome back.", emoji: "🌱", rarity: "rare" },
  { id: "weekend_warrior", title: "Weekend Warrior", description: "Made your bed both Saturday & Sunday.", emoji: "🌟", rarity: "rare" },
  { id: "ten_beds", title: "Ten Tucks", description: "Logged 10 beds total.", emoji: "🎯", rarity: "common" },
  { id: "fifty_beds", title: "Fifty Folds", description: "Logged 50 beds total.", emoji: "🏆", rarity: "epic" },
];

export const ACHIEVEMENT_MAP: Record<AchievementId, Achievement> = ALL_ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<AchievementId, Achievement>
);

function dayOfWeek(dateKey: string): number {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.getDay();
}

export function computeEarnedAchievements(
  entries: BedEntry[],
  profile: Pick<UserProfile, "streak" | "bestStreak" | "totalBeds">
): AchievementId[] {
  const earned = new Set<AchievementId>();
  if (entries.length >= 1) earned.add("first_bed");
  if (entries.length >= 10) earned.add("ten_beds");
  if (entries.length >= 50) earned.add("fifty_beds");
  if (profile.bestStreak >= 3 || profile.streak >= 3) earned.add("streak_3");
  if (profile.bestStreak >= 7 || profile.streak >= 7) earned.add("streak_7");
  if (profile.bestStreak >= 30 || profile.streak >= 30) earned.add("streak_30");
  if (entries.some((e) => e.score >= 95)) earned.add("perfect_vibe");

  for (const e of entries) {
    const id = (e as BedEntry & { createdAt?: number }).id;
    const ts = Number(id);
    if (!Number.isNaN(ts) && ts > 0) {
      const d = new Date(ts);
      if (d.getHours() < 8) {
        earned.add("early_bird");
        break;
      }
    }
  }

  const dates = new Set(entries.map((e) => e.date));
  for (const e of entries) {
    const day = dayOfWeek(e.date);
    if (day === 6) {
      const sunday = new Date(`${e.date}T00:00:00`);
      sunday.setDate(sunday.getDate() + 1);
      const sKey = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;
      if (dates.has(sKey)) {
        earned.add("weekend_warrior");
        break;
      }
    }
  }

  if (entries.length >= 2) {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(`${sorted[i - 1].date}T00:00:00`);
      const cur = new Date(`${sorted[i].date}T00:00:00`);
      const diff = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 3) {
        earned.add("comeback");
        break;
      }
    }
  }

  return Array.from(earned);
}

export function diffNewlyEarned(prev: AchievementId[], next: AchievementId[]): AchievementId[] {
  const prevSet = new Set(prev);
  return next.filter((id) => !prevSet.has(id));
}
