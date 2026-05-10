import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  signInWithEmail as svcSignIn,
  signUpWithEmail as svcSignUp,
  signInWithGoogle as svcGoogle,
  sendPasswordReset as svcReset,
  signOut as svcSignOut,
  deleteOwnProfile,
  supabase,
  AuthResult,
} from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
      console.log("[auth] initial session", data.session?.user?.id ?? "none");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log("[auth] state change", _event, s?.user?.id ?? "none");
      setSession(s ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    return svcSignIn(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    return svcSignUp(email, password, name);
  }, []);

  const signInGoogle = useCallback(async (): Promise<AuthResult> => {
    return svcGoogle();
  }, []);

  const sendReset = useCallback(async (email: string): Promise<AuthResult> => {
    return svcReset(email);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await svcSignOut();
    } catch (e) {
      console.log("[auth] signOut error", e);
    }
    setSession(null);
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const uid = session?.user?.id;
    try {
      if (uid && isSupabaseConfigured) {
        await deleteOwnProfile(uid);
      }
      await svcSignOut();
      const keys = ["bedvibe_entries_v2", "bedvibe_profile_v2", "bedvibe_achievements_v1"];
      await Promise.all(keys.map((k) => AsyncStorage.removeItem(k).catch(() => {})));
      setSession(null);
      return { ok: true };
    } catch (e) {
      console.log("[auth] deleteAccount error", e);
      return { ok: false, error: "Could not delete account." };
    }
  }, [session]);

  return useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      isAuthenticated: !!session?.user,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signInGoogle,
      sendReset,
      signOut,
      deleteAccount,
    }),
    [session, isLoading, signIn, signUp, signInGoogle, sendReset, signOut, deleteAccount]
  );
});
