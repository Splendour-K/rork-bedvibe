import "../polyfills";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/providers/AppProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import PaywallSheet from "@/components/PaywallSheet";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="alarm" options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="sleep-player" options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="recap" options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="privacy" options={{ headerShown: true, title: "Privacy Policy" }} />
      <Stack.Screen name="terms" options={{ headerShown: true, title: "Terms of Service" }} />
      <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
    </Stack>
  );
}

function NavigationGate() {
  const { profile, isLoading: appLoading } = useApp();
  const { isAuthenticated, isLoading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (appLoading || authLoading) return;
    const root = segments[0];
    const inAuth = root === "(auth)";
    const inOnboarding = root === "onboarding";

    if (isConfigured && !isAuthenticated) {
      if (!inAuth) router.replace("/(auth)/sign-in");
      return;
    }

    if (isAuthenticated && inAuth) {
      if (!profile.hasOnboarded) router.replace("/onboarding");
      else router.replace("/(tabs)/(home)");
      return;
    }

    if (!profile.hasOnboarded && !inOnboarding && !inAuth) {
      router.replace("/onboarding");
    } else if (profile.hasOnboarded && inOnboarding) {
      router.replace("/(tabs)/(home)");
    }
  }, [profile.hasOnboarded, appLoading, authLoading, isAuthenticated, isConfigured, segments, router]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <AppProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                  <RootLayoutNav />
                  <NavigationGate />
                  <PaywallSheet />
                  <StatusBar style="auto" />
                </View>
              </GestureHandlerRootView>
            </AppProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
