import { createClient, Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { LeaderboardUser } from "@/types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured: boolean = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

if (!isSupabaseConfigured) {
  console.log("[supabase] Not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : "https://placeholder.supabase.co",
  isSupabaseConfigured ? SUPABASE_ANON_KEY : "placeholder-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
  }
);

export interface AuthResult {
  ok: boolean;
  error?: string;
  needsConfirmation?: boolean;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Auth is not configured." };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) {
      console.log("[supabase] signIn error", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.log("[supabase] signIn exception", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Auth is not configured." };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() || "Bed Maker" },
      },
    });
    if (error) {
      console.log("[supabase] signUp error", error.message);
      return { ok: false, error: error.message };
    }
    const needsConfirmation = !data.session;
    return { ok: true, needsConfirmation };
  } catch (e) {
    console.log("[supabase] signUp exception", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Auth is not configured." };
  try {
    const redirectTo = Linking.createURL("/auth-callback");
    console.log("[supabase] google redirect", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== "web",
      },
    });
    if (error) {
      console.log("[supabase] google oauth error", error.message);
      return { ok: false, error: error.message };
    }
    if (Platform.OS === "web") {
      return { ok: true };
    }
    if (!data?.url) return { ok: false, error: "No OAuth URL returned." };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      return { ok: false, error: "Sign-in cancelled." };
    }
    const url = result.url;
    const fragment = url.includes("#") ? url.split("#")[1] : "";
    const params = new URLSearchParams(fragment);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      const queryStr = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
      const q = new URLSearchParams(queryStr);
      const code = q.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          console.log("[supabase] exchange error", exErr.message);
          return { ok: false, error: exErr.message };
        }
        return { ok: true };
      }
      return { ok: false, error: "Could not complete sign-in." };
    }
    const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (setErr) {
      console.log("[supabase] setSession error", setErr.message);
      return { ok: false, error: setErr.message };
    }
    return { ok: true };
  } catch (e) {
    console.log("[supabase] google exception", e);
    return { ok: false, error: "Could not complete Google sign-in." };
  }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Auth is not configured." };
  try {
    const redirectTo = Linking.createURL("/reset-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    console.log("[supabase] reset exception", e);
    return { ok: false, error: "Could not send reset email." };
  }
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.log("[supabase] signOut exception", e);
  }
}

export async function deleteOwnProfile(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      console.log("[supabase] delete profile error", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.log("[supabase] delete profile exception", e);
    return false;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export interface RemoteProfileRow {
  user_id: string;
  name: string;
  is_premium: boolean;
  avg_score: number;
  streak: number;
  best_streak: number;
  total_beds: number;
  weekly_score: number;
  updated_at?: string;
}

export async function upsertRemoteProfile(row: Omit<RemoteProfileRow, "updated_at">): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("profiles").upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) {
      console.log("[supabase] upsert profile error", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.log("[supabase] upsert exception", e);
    return false;
  }
}

export async function fetchRemoteLeaderboard(
  windowFilter: "week" | "all"
): Promise<LeaderboardUser[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const orderCol = windowFilter === "week" ? "weekly_score" : "avg_score";
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,name,is_premium,avg_score,streak,best_streak,total_beds,weekly_score")
      .eq("is_premium", true)
      .gt("total_beds", 0)
      .order(orderCol, { ascending: false })
      .limit(100);
    if (error) {
      console.log("[supabase] fetch leaderboard error", error.message);
      return null;
    }
    return (data ?? []).map((r): LeaderboardUser => ({
      id: r.user_id,
      name: r.name ?? "Bed Maker",
      avatar: "",
      streak: r.streak ?? 0,
      avgScore: r.avg_score ?? 0,
      weeklyScore: r.weekly_score ?? r.avg_score ?? 0,
      isPremium: !!r.is_premium,
    }));
  } catch (e) {
    console.log("[supabase] fetch leaderboard exception", e);
    return null;
  }
}
