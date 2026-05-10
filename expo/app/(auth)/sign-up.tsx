import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Sparkles } from "lucide-react-native";
import { getTheme, radius, spacing } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { tapLight, tapMedium, notifyError, notifySuccess } from "@/lib/haptics";
import GoogleButton from "@/components/GoogleButton";

export default function SignUpScreen() {
  const theme = getTheme("linen");
  const { signUp, signInGoogle, isConfigured } = useAuth();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [googleBusy, setGoogleBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please fill in your details.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    tapMedium();
    setBusy(true);
    const res = await signUp(email, password, name || "Bed Maker");
    setBusy(false);
    if (!res.ok) {
      notifyError();
      setError(res.error ?? "Could not create account.");
      return;
    }
    notifySuccess();
    if (res.needsConfirmation) {
      Alert.alert(
        "Check your inbox",
        "We sent you a confirmation email. Tap the link to activate your account, then come back and sign in.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }]
      );
    }
  }, [email, password, name, signUp]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    tapMedium();
    setGoogleBusy(true);
    const res = await signInGoogle();
    setGoogleBusy(false);
    if (!res.ok) {
      notifyError();
      setError(res.error ?? "Could not sign up with Google.");
    } else {
      notifySuccess();
    }
  }, [signInGoogle]);

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

            <View style={[styles.logo, { backgroundColor: theme.text }]}>
              <Sparkles size={20} color={theme.accent} fill={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Make your bed,{"\n"}make your day.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Create your account to start your streak.
            </Text>

            {!isConfigured && (
              <View style={[styles.banner, { backgroundColor: "#FDE3DD" }]}>
                <Text style={[styles.bannerText, { color: "#9A2C12" }]}>
                  Auth isn't configured yet. Add Supabase keys to continue.
                </Text>
              </View>
            )}

            <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <User size={18} color={theme.textMuted} />
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="Your name"
                placeholderTextColor={theme.textSubtle}
                style={[styles.input, { color: theme.text }]}
                maxLength={30}
                testID="name-input"
              />
            </View>

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
                testID="email-input"
              />
            </View>

            <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Lock size={18} color={theme.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPwd}
                textContentType="newPassword"
                placeholder="Password (min 6 characters)"
                placeholderTextColor={theme.textSubtle}
                style={[styles.input, { color: theme.text }]}
                testID="password-input"
              />
              <Pressable
                onPress={() => { tapLight(); setShowPwd((v) => !v); }}
                hitSlop={10}
              >
                {showPwd ? (
                  <EyeOff size={18} color={theme.textMuted} />
                ) : (
                  <Eye size={18} color={theme.textMuted} />
                )}
              </Pressable>
            </View>

            {error && (
              <Text style={[styles.error, { color: theme.error }]} testID="auth-error">
                {error}
              </Text>
            )}

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
              testID="sign-up-submit"
            >
              {busy ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={[styles.ctaText, { color: theme.background }]}>Create account</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSubtle }]}>or</Text>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>

            <GoogleButton onPress={handleGoogle} loading={googleBusy} label="Sign up with Google" />

            <Text style={[styles.legal, { color: theme.textSubtle }]}>
              By continuing, you agree to BedVibe's Terms and Privacy Policy.
            </Text>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account? </Text>
              <Pressable onPress={() => { tapLight(); router.replace("/(auth)/sign-in"); }} hitSlop={8}>
                <Text style={[styles.footerLink, { color: theme.text }]}>Sign in</Text>
              </Pressable>
            </View>
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
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -1, lineHeight: 36 },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: spacing.xl },
  banner: { padding: 12, borderRadius: radius.md, marginBottom: spacing.lg },
  bannerText: { fontSize: 12, fontWeight: "600" },
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
  error: { fontSize: 13, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  cta: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaText: { fontSize: 16, fontWeight: "800" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: spacing.lg },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "600" },
  legal: {
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 16,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "800" },
});
