import type { ThemeName } from "@/constants/colors";

export interface BedEntry {
  id: string;
  date: string;
  imageUri: string;
  score: number;
  title: string;
  affirmation: string;
  edgesScore: number;
  symmetryScore: number;
  smoothnessScore: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  avgScore: number;
  isPremium: boolean;
  weeklyScore?: number;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  isPremium: boolean;
  theme: ThemeName;
  reminderEnabled: boolean;
  reminderTime: string;
  streak: number;
  bestStreak: number;
  totalBeds: number;
  avgScore: number;
  userId: string;
  hasOnboarded: boolean;
  alarmEnabled: boolean;
  alarmTime: string;
  alarmDays: number[];
  goals?: string[];
}

export type BedTitle =
  | "Zen Master"
  | "Sleep Royalty"
  | "Cozy Commander"
  | "Pillow Perfectionist"
  | "Sheet Whisperer"
  | "Blanket Baron"
  | "Dream Weaver"
  | "Snuggle Sultan"
  | "Nap Navigator"
  | "Rest Rockstar";

export const bedTitles: Record<number, BedTitle[]> = {
  90: ["Zen Master", "Sleep Royalty", "Dream Weaver"],
  75: ["Cozy Commander", "Pillow Perfectionist", "Snuggle Sultan"],
  60: ["Sheet Whisperer", "Blanket Baron", "Rest Rockstar"],
  0: ["Nap Navigator"],
};

export const affirmations: Record<number, string[]> = {
  90: [
    "Your bed is a masterpiece of tranquility.",
    "Pure serenity in every fold. Keep shining.",
    "You've created a sanctuary of peace.",
  ],
  75: [
    "So close to perfection — your bed looks lovely.",
    "A cozy nest that welcomes sweet dreams.",
    "Beautifully made. The day is yours.",
  ],
  60: [
    "Every day is a fresh start — nice effort.",
    "Your bed is getting better every day.",
    "Small habits, big changes. Keep going.",
  ],
  0: [
    "Tomorrow is a new chance to make it great.",
    "Even a messy bed is a sign of a life lived.",
    "Progress, not perfection. You've got this.",
  ],
};

export function getTitleAndAffirmation(score: number): { title: BedTitle; affirmation: string } {
  const tier = score >= 90 ? 90 : score >= 75 ? 75 : score >= 60 ? 60 : 0;
  const titles = bedTitles[tier];
  const msgs = affirmations[tier];
  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    affirmation: msgs[Math.floor(Math.random() * msgs.length)],
  };
}
