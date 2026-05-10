import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Shield } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";

export default function PrivacyScreen() {
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: "Privacy Policy", headerShown: true, headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.text, headerTitleStyle: { fontWeight: "800" } }} />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
            <Shield size={26} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
          <Text style={[styles.meta, { color: theme.textSubtle }]}>Last updated: May 2026</Text>

          <P theme={theme}>
            BedVibe ("we", "our", "the app") is a daily morning and night routine app that scores how
            neat your bed is. We respect your privacy and only collect what we need to make BedVibe
            work for you.
          </P>

          <H theme={theme}>1. What we collect</H>
          <P theme={theme}>
            • Account info: your email, name, and password hash (when you create an account).{"\n"}
            • Bed photos & AI scores: stored on your device. Photos are sent privately to our AI
            provider for scoring and are not stored by us afterwards.{"\n"}
            • Streak, score history, and preferences (theme, reminder time).{"\n"}
            • Anonymous app usage, crash, and performance data so we can improve BedVibe.
          </P>

          <H theme={theme}>2. How we use your data</H>
          <P theme={theme}>
            • To score your bed photo and show your daily result.{"\n"}
            • To track your streak, history, and personal records.{"\n"}
            • To send the daily reminder you opted into.{"\n"}
            • To rank Premium users on the global leaderboard (only first name and score, not email).
          </P>

          <H theme={theme}>3. Your photos</H>
          <P theme={theme}>
            Your bed photos stay on your device. When you tap "Analyze", a single photo is sent over
            HTTPS to our AI provider to compute a score. We do not store the image on our servers
            and we do not use your photos to train any model.
          </P>

          <H theme={theme}>4. Notifications</H>
          <P theme={theme}>
            BedVibe sends notifications only for the morning reminder and (Premium) the wake-up
            alarm. You can turn these off any time in Profile or your device settings.
          </P>

          <H theme={theme}>5. Sharing</H>
          <P theme={theme}>
            We do not sell your data. We share data with three categories of providers strictly to
            run the app:{"\n"}
            • Our authentication and database provider (Supabase).{"\n"}
            • Our AI vision provider (used only to score your photo).{"\n"}
            • Apple/Google for in-app purchases and subscriptions.
          </P>

          <H theme={theme}>6. Subscriptions</H>
          <P theme={theme}>
            Premium subscriptions are managed by Apple or Google. Your payment info never touches
            our servers. You can cancel any time from your phone's subscription settings.
          </P>

          <H theme={theme}>7. Your choices</H>
          <P theme={theme}>
            • Sign out at any time from Profile.{"\n"}
            • Delete your account and all your data from Profile → Delete account.{"\n"}
            • Disable reminders or the camera permission from device settings.
          </P>

          <H theme={theme}>8. Children</H>
          <P theme={theme}>
            BedVibe is designed for users 13 and older. We do not knowingly collect data from
            children under 13.
          </P>

          <H theme={theme}>9. Contact</H>
          <P theme={theme}>
            Questions? Reach us at hello@bedvibe.app and we will respond within 5 business days.
          </P>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function H({ theme, children }: { theme: ReturnType<typeof getTheme>; children: React.ReactNode }) {
  return <Text style={[styles.h, { color: theme.text }]}>{children}</Text>;
}
function P({ theme, children }: { theme: ReturnType<typeof getTheme>; children: React.ReactNode }) {
  return <Text style={[styles.p, { color: theme.textMuted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 32 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -1 },
  meta: { fontSize: 12, fontWeight: "600", marginTop: 4, marginBottom: spacing.lg },
  h: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3, marginTop: spacing.lg, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 22, fontWeight: "500" },
});
