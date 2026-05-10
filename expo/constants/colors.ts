export type ThemeName = "linen" | "midnight" | "sunrise" | "pirate";

export interface ThemeColors {
  name: ThemeName;
  isDark: boolean;
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryInk: string;
  accent: string;
  accentSoft: string;
  accent2: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  borderStrong: string;
  tabBar: string;
  tabIconDefault: string;
  tabIconSelected: string;
  overlay: string;
  progressBackground: string;
  ringGradient: readonly [string, string];
  heroGradient: readonly [string, string, string];
  shadow: string;
}

const linen: ThemeColors = {
  name: "linen",
  isDark: false,
  background: "#F5F1EB",
  backgroundElevated: "#FBF8F3",
  surface: "#FFFFFF",
  surfaceAlt: "#FAF6F0",
  card: "#FFFFFF",
  text: "#1B1B1F",
  textMuted: "#6B6470",
  textSubtle: "#9A93A0",
  primary: "#1F1B2E",
  primaryInk: "#0F0D1A",
  accent: "#FF8A65",
  accentSoft: "#FFD6C4",
  accent2: "#B294E8",
  success: "#4FA98A",
  warning: "#E8A87C",
  error: "#E76F51",
  border: "#EAE3DB",
  borderStrong: "#D8CFC4",
  tabBar: "#FFFFFFEE",
  tabIconDefault: "#A89F95",
  tabIconSelected: "#1F1B2E",
  overlay: "rgba(15,13,26,0.55)",
  progressBackground: "#EFE8DF",
  ringGradient: ["#FF8A65", "#B294E8"] as const,
  heroGradient: ["#FFE4D4", "#F5E1F0", "#E5DCFB"] as const,
  shadow: "rgba(31,27,46,0.10)",
};

const midnight: ThemeColors = {
  name: "midnight",
  isDark: true,
  background: "#0E1024",
  backgroundElevated: "#161931",
  surface: "#1B1F3B",
  surfaceAlt: "#222748",
  card: "#1B1F3B",
  text: "#F4EFE3",
  textMuted: "#A9A8C4",
  textSubtle: "#6E6E92",
  primary: "#F4EFE3",
  primaryInk: "#FFFFFF",
  accent: "#F5C97B",
  accentSoft: "#3A3458",
  accent2: "#8FA8FF",
  success: "#7BD8B0",
  warning: "#F5C97B",
  error: "#FF8A8A",
  border: "#2A2F50",
  borderStrong: "#3A406B",
  tabBar: "#0E1024EE",
  tabIconDefault: "#6E6E92",
  tabIconSelected: "#F5C97B",
  overlay: "rgba(0,0,0,0.65)",
  progressBackground: "#2A2F50",
  ringGradient: ["#F5C97B", "#8FA8FF"] as const,
  heroGradient: ["#1B1F3B", "#2C2455", "#3A2D6B"] as const,
  shadow: "rgba(0,0,0,0.4)",
};

const sunrise: ThemeColors = {
  name: "sunrise",
  isDark: false,
  background: "#FFF5EC",
  backgroundElevated: "#FFFAF3",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF1E2",
  card: "#FFFFFF",
  text: "#3A1E2A",
  textMuted: "#8B5E6E",
  textSubtle: "#C49AA8",
  primary: "#C2185B",
  primaryInk: "#7A0E3A",
  accent: "#FF7043",
  accentSoft: "#FFD2C0",
  accent2: "#F4B26A",
  success: "#5BB89B",
  warning: "#F4B26A",
  error: "#D94B4B",
  border: "#FAD9C5",
  borderStrong: "#F2B795",
  tabBar: "#FFFFFFEE",
  tabIconDefault: "#D4A99B",
  tabIconSelected: "#C2185B",
  overlay: "rgba(122,14,58,0.5)",
  progressBackground: "#FFE5D2",
  ringGradient: ["#FF7043", "#C2185B"] as const,
  heroGradient: ["#FFD9C0", "#FFB59A", "#FF7B9A"] as const,
  shadow: "rgba(194,24,91,0.12)",
};

const pirate: ThemeColors = {
  name: "pirate",
  isDark: false,
  background: "#F2E5C8",
  backgroundElevated: "#F8EFD6",
  surface: "#FFF8E1",
  surfaceAlt: "#EBDAB1",
  card: "#FFF8E1",
  text: "#2B1B0E",
  textMuted: "#7A5A3A",
  textSubtle: "#A48861",
  primary: "#5C3A14",
  primaryInk: "#3A1F08",
  accent: "#C68A2E",
  accentSoft: "#E8D29B",
  accent2: "#6B8E4E",
  success: "#6B8E4E",
  warning: "#C68A2E",
  error: "#A8341E",
  border: "#DCC799",
  borderStrong: "#B89A60",
  tabBar: "#FFF8E1EE",
  tabIconDefault: "#B89A60",
  tabIconSelected: "#5C3A14",
  overlay: "rgba(43,27,14,0.55)",
  progressBackground: "#E8D29B",
  ringGradient: ["#C68A2E", "#5C3A14"] as const,
  heroGradient: ["#F0DBA8", "#D9B26A", "#A8742B"] as const,
  shadow: "rgba(43,27,14,0.18)",
};

export const themes: Record<ThemeName, ThemeColors> = {
  linen,
  midnight,
  sunrise,
  pirate,
};

export const themeOrder: ThemeName[] = ["linen", "midnight", "sunrise", "pirate"];

export const themeMeta: Record<ThemeName, { label: string; tagline: string; isPremium: boolean; preview: readonly [string, string, string] }> = {
  linen: {
    label: "Linen",
    tagline: "Calm cream & dusk",
    isPremium: false,
    preview: ["#F5F1EB", "#FF8A65", "#B294E8"] as const,
  },
  midnight: {
    label: "Midnight",
    tagline: "Deep velvet & gold",
    isPremium: true,
    preview: ["#0E1024", "#F5C97B", "#8FA8FF"] as const,
  },
  sunrise: {
    label: "Sunrise",
    tagline: "Warm peach glow",
    isPremium: true,
    preview: ["#FFD9C0", "#FF7043", "#C2185B"] as const,
  },
  pirate: {
    label: "Pirate Cove",
    tagline: "Brass & parchment",
    isPremium: true,
    preview: ["#F2E5C8", "#C68A2E", "#5C3A14"] as const,
  },
};

export const getTheme = (name: ThemeName | string | undefined): ThemeColors => {
  if (!name) return linen;
  return themes[name as ThemeName] ?? linen;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
