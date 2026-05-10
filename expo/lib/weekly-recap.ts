import { BedEntry } from "@/types";

export interface WeeklyRecap {
  weekStart: string;
  weekEnd: string;
  daysLogged: number;
  bestScore: number;
  bestTitle: string | null;
  avgScore: number;
  topTitles: string[];
  entries: BedEntry[];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getCurrentWeekRange(): { start: Date; end: Date; startKey: string; endKey: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end, startKey: dateKey(start), endKey: dateKey(end) };
}

export function buildWeeklyRecap(entries: BedEntry[]): WeeklyRecap {
  const { start, end, startKey, endKey } = getCurrentWeekRange();
  const week = entries.filter((e) => e.date >= startKey && e.date <= endKey);
  const sortedByScore = [...week].sort((a, b) => b.score - a.score);
  const best = sortedByScore[0] ?? null;
  const titleCounts = new Map<string, number>();
  for (const e of week) {
    titleCounts.set(e.title, (titleCounts.get(e.title) ?? 0) + 1);
  }
  const topTitles = [...titleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
  const avg = week.length > 0 ? Math.round(week.reduce((s, e) => s + e.score, 0) / week.length) : 0;
  return {
    weekStart: startKey,
    weekEnd: endKey,
    daysLogged: week.length,
    bestScore: best?.score ?? 0,
    bestTitle: best?.title ?? null,
    avgScore: avg,
    topTitles,
    entries: week,
  };
}

export function formatWeekRange(startKey: string, endKey: string): string {
  const s = new Date(startKey);
  const e = new Date(endKey);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  try {
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
  } catch {
    return `${startKey} – ${endKey}`;
  }
}

export function isSunday(): boolean {
  return new Date().getDay() === 0;
}
