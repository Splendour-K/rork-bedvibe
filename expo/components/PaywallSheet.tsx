import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Check, Crown, Globe, Palette, Sparkles, X, Zap } from "lucide-react-native";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { notifySuccess, tapLight, tapMedium } from "@/lib/haptics";

const FEATURES = [
  { icon: Palette, title: "Premium themes", body: "Midnight, Sunrise, Pirate Cove and more." },
  { icon: Globe, title: "Global leaderboard", body: "Climb the ranks with bed-makers worldwide." },
  { icon: Sparkles, title: "Insights & journal", body: "Patterns and personal records that evolve with you." },
  { icon: Zap, title: "Wake-up alarm", body: "A gentle nudge to start your bed routine." },
];

type Plan = "yearly" | "monthly";

export default function PaywallSheet() {
  const { paywallVisible, hidePaywall, togglePremium, profile } = useApp();
  const theme = getTheme(profile.theme);
  const [plan, setPlan] = useState<Plan>("yearly");
  const slide = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (paywallVisible) {
      Animated.parallel([
        Animated.timing(slide, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      slide.setValue(0);
      backdrop.setValue(0);
    }
  }, [paywallVisible, slide, backdrop]);

  const close = (): void => {
    tapLight();
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => hidePaywall());
  };

  const handleStart = async (): Promise<void> => {
    // NOTE for developers: this is where to wire real in-app purchases.
    // 1. Set up products in App Store Connect / Google Play Console.
    // 2. Use react-native-iap or RevenueCat in a custom dev client (EAS build).
    // 3. On successful purchase, call togglePremium() (or set isPremium=true).
    // For now we unlock Premium locally so the rest of the app works end-to-end.
    notifySuccess();
    await togglePremium();
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => hidePaywall());
  };

  const screenH = Dimensions.get("window").height;
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [screenH, 0] });

  return (
    <Modal
      visible={paywallVisible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.backgroundElevated,
            transform: [{ translateY }],
            shadowColor: theme.shadow,
          },
        ]}
        testID="paywall-sheet"
      >
        <View style={styles.handle}>
          <View style={[styles.handleBar, { backgroundColor: theme.borderStrong }]} />
        </View>

        <Pressable onPress={close} style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]} testID="paywall-close">
          <X size={18} color={theme.text} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={theme.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {Platform.OS !== "web" && (
                <BlurView intensity={20} tint={theme.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              )}
              <View style={[styles.crownBadge, { backgroundColor: theme.surface }]}>
                <Crown size={28} color={theme.accent} fill={theme.accent} />
              </View>
              <Text style={[styles.heroTitle, { color: theme.text }]}>BedVibe Premium</Text>
              <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
                Unlock the full vibe — themes, leaderboard, coach & more.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: theme.accentSoft }]}>
                  <f.icon size={18} color={theme.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
                  <Text style={[styles.featureBody, { color: theme.textMuted }]}>{f.body}</Text>
                </View>
                <Check size={18} color={theme.success} />
              </View>
            ))}
          </View>

          <View style={styles.plans}>
            <PlanCard
              selected={plan === "yearly"}
              onPress={() => { tapLight(); setPlan("yearly"); }}
              title="Yearly"
              price="$29.99"
              per="/ year"
              note="Just $2.50/month"
              badge="Best value · Save 50%"
              theme={theme}
            />
            <PlanCard
              selected={plan === "monthly"}
              onPress={() => { tapLight(); setPlan("monthly"); }}
              title="Monthly"
              price="$4.99"
              per="/ month"
              theme={theme}
            />
          </View>

          <Pressable
            onPress={() => { tapMedium(); handleStart(); }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: theme.text, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            testID="paywall-cta"
          >
            <Text style={[styles.ctaText, { color: theme.background }]}>Start 7-day free trial</Text>
          </Pressable>

          <View style={styles.footRow}>
            <Text style={[styles.footText, { color: theme.textSubtle }]}>Cancel anytime</Text>
            <Text style={[styles.footText, { color: theme.textSubtle }]}>·</Text>
            <Pressable
              onPress={() => {
                tapLight();
                Alert.alert("Restore purchases", "No previous BedVibe Premium purchase was found on this device.");
              }}
              testID="paywall-restore"
            >
              <Text style={[styles.footText, styles.footLink, { color: theme.textSubtle }]}>Restore</Text>
            </Pressable>
            <Text style={[styles.footText, { color: theme.textSubtle }]}>·</Text>
            <Pressable
              onPress={() => { tapLight(); hidePaywall(); router.push("/terms"); }}
              testID="paywall-terms"
            >
              <Text style={[styles.footText, styles.footLink, { color: theme.textSubtle }]}>Terms</Text>
            </Pressable>
            <Text style={[styles.footText, { color: theme.textSubtle }]}>·</Text>
            <Pressable
              onPress={() => { tapLight(); hidePaywall(); router.push("/privacy"); }}
              testID="paywall-privacy"
            >
              <Text style={[styles.footText, styles.footLink, { color: theme.textSubtle }]}>Privacy</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

interface PlanCardProps {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  per: string;
  note?: string;
  badge?: string;
  theme: ReturnType<typeof getTheme>;
}

function PlanCard({ selected, onPress, title, price, per, note, badge, theme }: PlanCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.planCard,
        {
          backgroundColor: selected ? theme.text : theme.surface,
          borderColor: selected ? theme.text : theme.border,
        },
      ]}
    >
      {badge && (
        <View style={[styles.planBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.planBadgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.planTitle, { color: selected ? theme.background : theme.text }]}>{title}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.planPrice, { color: selected ? theme.background : theme.text }]}>{price}</Text>
        <Text style={[styles.planPer, { color: selected ? theme.background : theme.textMuted }]}>{per}</Text>
      </View>
      {note && <Text style={[styles.planNote, { color: selected ? theme.background : theme.textMuted }]}>{note}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "92%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 30,
  },
  handle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  hero: {
    paddingVertical: 32,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  crownBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  features: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  featureBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  plans: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.lg,
  },
  planCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    minHeight: 110,
  },
  planBadge: {
    position: "absolute",
    top: -10,
    left: 12,
    right: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.4,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  planPer: {
    fontSize: 12,
    fontWeight: "500",
  },
  planNote: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  cta: {
    paddingVertical: 18,
    borderRadius: radius.pill,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  footRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  footText: {
    fontSize: 12,
    fontWeight: "500",
  },
  footLink: {
    textDecorationLine: "underline",
  },
});
