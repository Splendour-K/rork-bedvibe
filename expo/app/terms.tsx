import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { FileText } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/providers/AppProvider";
import { getTheme, spacing } from "@/constants/colors";

export default function TermsScreen() {
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: "Terms of Service", headerShown: true, headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.text, headerTitleStyle: { fontWeight: "800" } }} />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
            <FileText size={26} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Terms of Service</Text>
          <Text style={[styles.meta, { color: theme.textSubtle }]}>Last updated: May 2026</Text>

          <P theme={theme}>
            By using BedVibe, you agree to these terms. If you do not agree, please do not use the
            app.
          </P>

          <H theme={theme}>1. Your account</H>
          <P theme={theme}>
            You are responsible for the activity on your account and for keeping your password
            safe. You must be 13 or older to create an account.
          </P>

          <H theme={theme}>2. AI scoring is for fun</H>
          <P theme={theme}>
            BedVibe uses an AI vision model to estimate how neat your bed looks. Scores are
            playful and approximate — not a medical, professional, or expert judgment. Have fun
            with it.
          </P>

          <H theme={theme}>3. Premium subscriptions</H>
          <P theme={theme}>
            Premium unlocks bedtime stories, relaxation audio, the leaderboard, premium themes,
            wake-up alarm, and advanced insights. Subscriptions are billed by Apple or Google. The
            7-day free trial converts to a paid plan unless you cancel before it ends. Manage or
            cancel any time from your phone's subscription settings.
          </P>

          <H theme={theme}>4. Acceptable use</H>
          <P theme={theme}>
            Don't upload photos of other people without consent, illegal content, or anything that
            violates someone's rights. Don't try to break, scrape, or attack the service. We may
            suspend accounts that misuse BedVibe.
          </P>

          <H theme={theme}>5. Content you create</H>
          <P theme={theme}>
            You own your photos. By using BedVibe you grant us a limited permission to process
            your photo for the sole purpose of generating your score. We do not republish your
            photos.
          </P>

          <H theme={theme}>6. Service "as is"</H>
          <P theme={theme}>
            BedVibe is provided "as is", without warranties. We do our best to keep the app
            running but we cannot guarantee 100% uptime, perfect AI accuracy, or that the
            leaderboard will always be available.
          </P>

          <H theme={theme}>7. Liability</H>
          <P theme={theme}>
            To the maximum extent allowed by law, BedVibe is not liable for indirect, incidental,
            or consequential damages arising from your use of the app.
          </P>

          <H theme={theme}>8. Changes</H>
          <P theme={theme}>
            We may update these terms occasionally. If we make a meaningful change we will let you
            know in the app. Continued use means you accept the updated terms.
          </P>

          <H theme={theme}>9. Termination</H>
          <P theme={theme}>
            You can stop using BedVibe and delete your account any time from Profile → Delete
            account. We may end access for users who violate these terms.
          </P>

          <H theme={theme}>10. Contact</H>
          <P theme={theme}>
            Questions about these terms? Email hello@bedvibe.app.
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
