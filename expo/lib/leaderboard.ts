import { LeaderboardUser } from "@/types";
import { fetchRemoteLeaderboard, isSupabaseConfigured } from "@/lib/supabase";

export type LeaderboardWindow = "week" | "all";

export async function fetchLeaderboard(
  windowFilter: LeaderboardWindow,
  currentUser: LeaderboardUser | null
): Promise<LeaderboardUser[]> {
  if (!isSupabaseConfigured) {
    return currentUser && currentUser.isPremium ? [currentUser] : [];
  }
  const remote = await fetchRemoteLeaderboard(windowFilter);
  if (!remote) return currentUser && currentUser.isPremium ? [currentUser] : [];
  const filtered = currentUser ? remote.filter((u) => u.id !== currentUser.id) : remote;
  const board = [...filtered];
  if (currentUser && currentUser.isPremium) board.push(currentUser);
  return board;
}

export function rankBy(window: LeaderboardWindow, board: LeaderboardUser[]): LeaderboardUser[] {
  const sorted = [...board].sort((a, b) => {
    const aScore = window === "week" ? a.weeklyScore ?? a.avgScore : a.avgScore;
    const bScore = window === "week" ? b.weeklyScore ?? b.avgScore : b.avgScore;
    if (bScore !== aScore) return bScore - aScore;
    return b.streak - a.streak;
  });
  return sorted;
}
