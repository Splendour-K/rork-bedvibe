import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { getTheme, radius, spacing } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { tapLight, tapMedium, notifyError, notifySuccess } from "@/lib/haptics";

export default function ForgotPasswordScreen() {
  const theme = getTheme("linen");
  const { sendReset } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<boolean>(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    tapMedium();
    setBusy(true);
    const res = await sendReset(email);
    setBusy(false);
    if (!res.ok) {
      notifyError();
      setError(res.error ?? "Could not send reset email.");
      return;
    }
    notifySuccess();
    setSent(true);
  }, [email, sendReset]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={["#FFE3D6", "#F5F1EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => { tapLight(); router.back(); }}
              hitSlop={12}
              style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <ArrowLeft size={18} color={theme.text} />
            </Pressable>

            <Text style={[styles.title, { color: theme.text }]}>Reset password</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              We'll send a reset link to your inbox.
            </Text>

            <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Mail size={18} color={theme.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
                placeholderTextColor={theme.textSubtle}
                style={[styles.input, { color: theme.text }]}
                editable={!sent}
              />
            </View>

            {error && (
              <Text style={[styles.error, { color: theme.error }]}>
                {error}
              </Text>
            )}

            {sent ? (
              <View>
                <Text style={[styles.success, { color: theme.success }]}>
                  ✓ Check your email for the reset link.
                </Text>
                <Pressable
                  onPress={() => { tapLight(); router.replace("/(auth)/sign-in"); }}
                  style={[styles.cta, { backgroundColor: theme.text }]}
                >
                  <Text style={[styles.ctaText, { color: theme.background }]}>Back to sign in</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleSubmit}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: theme.text,
                    opacity: busy ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={[styles.ctaText, { color: theme.background }]}>Send reset link</Text>
                )}
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 40 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -1 },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: spacing.xl },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 0 },
  error: { fontSize: 13, fontWeight: "600", marginBottom: 12 },
  success: { fontSize: 14, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  cta: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 16, fontWeight: "800" },
});
