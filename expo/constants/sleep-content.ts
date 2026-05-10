export interface SleepTrack {
  id: string;
  title: string;
  subtitle: string;
  durationSec: number;
  cover: string;
  audioUrl: string;
  kind: "story" | "ambient";
  freePreview?: boolean;
  gradient: readonly [string, string];
}

const SH = (n: number): string => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

export const STORIES: SleepTrack[] = [
  {
    id: "story-moonlit-cottage",
    title: "The Moonlit Cottage",
    subtitle: "A slow walk through a sleepy village",
    durationSec: 9 * 60 + 12,
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80",
    audioUrl: SH(1),
    kind: "story",
    freePreview: true,
    gradient: ["#1B1F3B", "#3A2D6B"] as const,
  },
  {
    id: "story-river-of-stars",
    title: "River of Stars",
    subtitle: "Drift along a silver stream",
    durationSec: 11 * 60 + 30,
    cover: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=900&q=80",
    audioUrl: SH(2),
    kind: "story",
    gradient: ["#0E1024", "#2C2455"] as const,
  },
  {
    id: "story-old-lighthouse",
    title: "The Old Lighthouse Keeper",
    subtitle: "A gentle tale by the sea",
    durationSec: 12 * 60 + 4,
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
    audioUrl: SH(3),
    kind: "story",
    gradient: ["#1A2A44", "#2E4A6B"] as const,
  },
  {
    id: "story-quiet-train",
    title: "The Quiet Train",
    subtitle: "Rain on the window, cabin warm",
    durationSec: 10 * 60 + 22,
    cover: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=900&q=80",
    audioUrl: SH(4),
    kind: "story",
    gradient: ["#2B2440", "#4A3E6B"] as const,
  },
  {
    id: "story-pine-forest",
    title: "Whispers of the Pine Forest",
    subtitle: "A slow hike under tall trees",
    durationSec: 13 * 60 + 8,
    cover: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=80",
    audioUrl: SH(5),
    kind: "story",
    gradient: ["#1D2A22", "#3A5240"] as const,
  },
  {
    id: "story-paper-boat",
    title: "Paper Boat to the Moon",
    subtitle: "A child's bedtime journey",
    durationSec: 8 * 60 + 50,
    cover: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900&q=80",
    audioUrl: SH(6),
    kind: "story",
    gradient: ["#22184A", "#4A2E6B"] as const,
  },
];

export const AMBIENT: SleepTrack[] = [
  {
    id: "ambient-rain",
    title: "Soft Rain",
    subtitle: "Gentle rainfall on rooftops",
    durationSec: 30 * 60,
    cover: "https://images.unsplash.com/photo-1438449805896-28a666819a20?w=900&q=80",
    audioUrl: SH(7),
    kind: "ambient",
    freePreview: true,
    gradient: ["#1F2A44", "#3E5278"] as const,
  },
  {
    id: "ambient-ocean",
    title: "Ocean Waves",
    subtitle: "Slow tides on a quiet beach",
    durationSec: 30 * 60,
    cover: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=900&q=80",
    audioUrl: SH(8),
    kind: "ambient",
    gradient: ["#103040", "#266180"] as const,
  },
  {
    id: "ambient-fireplace",
    title: "Crackling Fireplace",
    subtitle: "A warm cabin at night",
    durationSec: 30 * 60,
    cover: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=900&q=80",
    audioUrl: SH(9),
    kind: "ambient",
    gradient: ["#3A1E0E", "#7A3A1A"] as const,
  },
  {
    id: "ambient-white-noise",
    title: "White Noise",
    subtitle: "Soft static for deep focus",
    durationSec: 30 * 60,
    cover: "https://images.unsplash.com/photo-1483137140003-ae073b395549?w=900&q=80",
    audioUrl: SH(10),
    kind: "ambient",
    gradient: ["#1B1B1F", "#3A3A40"] as const,
  },
  {
    id: "ambient-forest",
    title: "Forest at Dusk",
    subtitle: "Crickets, leaves, and breeze",
    durationSec: 30 * 60,
    cover: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=900&q=80",
    audioUrl: SH(11),
    kind: "ambient",
    gradient: ["#1A2E1F", "#33523F"] as const,
  },
  {
    id: "ambient-breathing",
    title: "4-7-8 Breathing",
    subtitle: "Guided breath to fall asleep",
    durationSec: 6 * 60,
    cover: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900&q=80",
    audioUrl: SH(12),
    kind: "ambient",
    gradient: ["#2A1E44", "#5A3E78"] as const,
  },
];

export const ALL_TRACKS: SleepTrack[] = [...STORIES, ...AMBIENT];

export function getTrackById(id: string): SleepTrack | null {
  return ALL_TRACKS.find((t) => t.id === id) ?? null;
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function tonightsStory(): SleepTrack {
  const day = new Date().getDate();
  return STORIES[day % STORIES.length];
}
