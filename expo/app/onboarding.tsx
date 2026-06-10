import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Headphones,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react-native";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { tapLight, tapMedium, notifySuccess } from "@/lib/haptics";
import { ensurePermission, isNotificationsSupported } from "@/lib/notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type StepKey =
  | "welcome"
  | "problem"
  | "value"
  | "habit"
  | "goals"
  | "reminder"
  | "challenge"
  | "premiumIntro"
  | "paywall"
  | "offer"
  | "ready";

const STEP_ORDER: StepKey[] = [
  "welcome",
  "problem",
  "value",
  "habit",
  "goals",
  "reminder",
  "challenge",
  "premiumIntro",
  "paywall",
  "offer",
  "ready",
];

const PROGRESS_STEPS: StepKey[] = [
  "welcome",
  "problem",
  "value",
  "habit",
  "goals",
  "reminder",
  "challenge",
];

const GOAL_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: "discipline", label: "Build discipline", emoji: "💪" },
  { id: "morning", label: "Start my day better", emoji: "☀️" },
  { id: "clean", label: "Keep my room clean", emoji: "🧺" },
  { id: "organised", label: "Feel more organised", emoji: "✨" },
  { id: "sleep", label: "Sleep and wake better", emoji: "🌙" },
  { id: "fun", label: "Just have fun", emoji: "🎉" },
];

const REMINDER_OPTIONS: { id: string; label: string; time: string }[] = [
  { id: "6", label: "6:00 AM", time: "06:00" },
  { id: "7", label: "7:00 AM", time: "07:00" },
  { id: "8", label: "8:00 AM", time: "08:00" },
];

export default function OnboardingScreen() {
  const { profile, updateProfile, setReminder } = useApp();
  const theme = getTheme(profile.theme);

  const [step, setStep] = useState<StepKey>("welcome");
  const [goals, setGoals] = useState<string[]>(profile.goals ?? []);
  const [reminderId, setReminderId] = useState<string>("7");
  const [customHour, setCustomHour] = useState<number>(7);
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [notifGranted, setNotifGranted] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const transitionTo = useCallback(
    (next: StepKey) => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slide, { toValue: -20, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setStep(next);
        slide.setValue(20);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
          Animated.timing(slide, {
            toValue: 0,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fade, slide]
  );

  const next = useCallback(
    (target: StepKey) => {
      tapMedium();
      transitionTo(target);
    },
    [transitionTo]
  );

  const stepIndex = useMemo(() => STEP_ORDER.indexOf(step), [step]);
  const progressIndex = useMemo(
    () => Math.min(PROGRESS_STEPS.indexOf(step), PROGRESS_STEPS.length - 1),
    [step]
  );
  const showProgress = PROGRESS_STEPS.includes(step);

  const finishOnboarding = useCallback(
    async (premium: boolean) => {
      notifySuccess();
      const reminderTime = useCustom
        ? `${String(customHour).padStart(2, "0")}:00`
        : REMINDER_OPTIONS.find((r) => r.id === reminderId)?.time ?? "07:00";
      await updateProfile({
        hasOnboarded: true,
        goals,
        reminderTime,
        isPremium: premium ? true : profile.isPremium,
      });
      router.replace("/(tabs)/(home)");
    },
    [customHour, goals, profile.isPremium, reminderId, updateProfile, useCustom]
  );

  const handleEnableReminder = useCallback(async () => {
    tapLight();
    setBusy(true);
    try {
      const reminderTime = useCustom
        ? `${String(customHour).padStart(2, "0")}:00`
        : REMINDER_OPTIONS.find((r) => r.id === reminderId)?.time ?? "07:00";
      if (isNotificationsSupported) {
        const granted = await ensurePermission();
        setNotifGranted(granted);
        if (granted) {
          await setReminder(true, reminderTime);
        }
      }
      transitionTo("challenge");
    } finally {
      setBusy(false);
    }
  }, [customHour, reminderId, setReminder, transitionTo, useCustom]);

  const handleUnlockPremium = useCallback(async () => {
    tapMedium();
    finishOnboarding(true);
  }, [finishOnboarding]);

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <WelcomeStep theme={theme} onNext={() => next("problem")} />;
      case "problem":
        return <ProblemStep theme={theme} onNext={() => next("value")} />;
      case "value":
        return <ValueStep theme={theme} onNext={() => next("habit")} />;
      case "habit":
        return <HabitStep theme={theme} onNext={() => next("goals")} />;
      case "goals":
        return (
          <GoalsStep
            theme={theme}
            goals={goals}
            setGoals={setGoals}
            onNext={() => next("reminder")}
          />
        );
      case "reminder":
        return (
          <ReminderStep
            theme={theme}
            reminderId={reminderId}
            setReminderId={setReminderId}
            useCustom={useCustom}
            setUseCustom={setUseCustom}
            customHour={customHour}
            setCustomHour={setCustomHour}
            busy={busy}
            onNext={handleEnableReminder}
          />
        );
      case "challenge":
        return <ChallengeStep theme={theme} onNext={() => next("premiumIntro")} />;
      case "premiumIntro":
        return (
          <PremiumIntroStep
            theme={theme}
            onUnlock={() => next("paywall")}
            onSkip={() => next("ready")}
          />
        );
      case "paywall":
        return (
          <PaywallStep
            theme={theme}
            onPurchase={handleUnlockPremium}
            onSkip={() => next("offer")}
          />
        );
      case "offer":
        return (
          <OfferStep
            theme={theme}
            onClaim={handleUnlockPremium}
            onSkip={() => next("ready")}
          />
        );
      case "ready":
        return <ReadyStep theme={theme} onFinish={() => finishOnboarding(false)} />;
    }
  };

  const isDarkScreen = step === "paywall" || step === "offer";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} testID="onboarding">
      {!isDarkScreen && (
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {isDarkScreen && (
        <LinearGradient
          colors={["#0E1024", "#1B1F3B", "#2C2455"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {showProgress && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              {PROGRESS_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor:
                        i <= progressIndex ? theme.primary : "rgba(0,0,0,0.08)",
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <Animated.View
          style={[
            styles.stepWrap,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
          key={String(stepIndex)}
        >
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

interface StepProps {
  theme: ReturnType<typeof getTheme>;
}

function PrimaryCTA({
  label,
  onPress,
  theme,
  disabled,
  testId,
  dark,
}: {
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof getTheme>;
  disabled?: boolean;
  testId?: string;
  dark?: boolean;
}) {
  const bg = dark ? "#FFFFFF" : theme.primary;
  const fg = dark ? "#0E1024" : theme.background;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.cta,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
      testID={testId}
    >
      <Text style={[styles.ctaText, { color: fg }]}>{label}</Text>
      <ChevronRight size={18} color={fg} />
    </Pressable>
  );
}

function SecondaryCTA({
  label,
  onPress,
  theme,
  testId,
  dark,
}: {
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof getTheme>;
  testId?: string;
  dark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={styles.secondaryCta}
      testID={testId}
    >
      <Text
        style={[
          styles.secondaryCtaText,
          { color: dark ? "rgba(255,255,255,0.7)" : theme.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Screen 1: Welcome ─────────────────────────────────────────────────────────
function WelcomeStep({ theme, onNext }: StepProps & { onNext: () => void }) {
  const float = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(float, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [float, sparkle]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const sparkleOpacity = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const sparkleScale = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] });

  return (
    <View style={styles.stepInner}>
      <View style={styles.heroArea}>
        <Animated.View style={{ transform: [{ translateY }], alignItems: "center" }}>
          <View style={[styles.bedIllustration, { backgroundColor: "rgba(255,255,255,0.55)", borderColor: theme.border }]}>
            <View style={[styles.bedHeadboard, { backgroundColor: theme.primary }]} />
            <View style={[styles.bedPillow, { backgroundColor: "#FFFFFF", borderColor: theme.border }]} />
            <View style={[styles.bedPillow, styles.bedPillow2, { backgroundColor: "#FFFFFF", borderColor: theme.border }]} />
            <View style={[styles.bedBlanket, { backgroundColor: theme.accent }]} />
            <View style={[styles.bedBlanketFold, { backgroundColor: theme.accentSoft }]} />
            <View style={[styles.bedFrame, { backgroundColor: theme.primary }]} />
          </View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleTL,
              { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
            ]}
          >
            <Sparkles size={20} color={theme.accent} fill={theme.accent} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleTR,
              { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
            ]}
          >
            <Sparkles size={14} color={theme.accent2} fill={theme.accent2} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleBR,
              { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
            ]}
          >
            <Sparkles size={16} color={theme.accent} fill={theme.accent} />
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.textArea}>
        <Text style={[styles.brand, { color: theme.primary }]}>BedVibe</Text>
        <Text style={[styles.title, { color: theme.text }]}>Start your day{"\n"}with a made bed.</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Take one photo each morning. Get your Bed Score. Build a routine that makes you feel in control before the day even starts.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="Get Started" onPress={onNext} theme={theme} testId="ob-welcome-next" />
      </View>
    </View>
  );
}

// ── Screen 2: Problem ─────────────────────────────────────────────────────────
function ProblemStep({ theme, onNext }: StepProps & { onNext: () => void }) {
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(flip, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
        Animated.delay(1200),
        Animated.timing(flip, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
      ])
    ).start();
  }, [flip]);

  const messyOpacity = flip.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const cleanOpacity = flip.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.stepInner}>
      <View style={styles.heroArea}>
        <View style={styles.compareWrap}>
          <Animated.View style={[styles.compareCard, { opacity: messyOpacity, backgroundColor: "rgba(255,255,255,0.55)", borderColor: theme.border }]}>
            <View style={[styles.messyBlanket, { backgroundColor: theme.warning, transform: [{ rotate: "-6deg" }] }]} />
            <View style={[styles.messyBlanket2, { backgroundColor: theme.accentSoft, transform: [{ rotate: "8deg" }] }]} />
            <View style={[styles.bedFrame, { backgroundColor: theme.primary }]} />
            <View style={[styles.tag, { backgroundColor: theme.error }]}>
              <Text style={styles.tagText}>MESSY</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.compareCard, StyleSheet.absoluteFill, { opacity: cleanOpacity, backgroundColor: "rgba(255,255,255,0.55)", borderColor: theme.border }]}>
            <View style={[styles.bedHeadboard, { backgroundColor: theme.primary }]} />
            <View style={[styles.bedPillow, { backgroundColor: "#FFFFFF", borderColor: theme.border }]} />
            <View style={[styles.bedPillow, styles.bedPillow2, { backgroundColor: "#FFFFFF", borderColor: theme.border }]} />
            <View style={[styles.bedBlanket, { backgroundColor: theme.success }]} />
            <View style={[styles.bedFrame, { backgroundColor: theme.primary }]} />
            <View style={[styles.tag, { backgroundColor: theme.success }]}>
              <Text style={styles.tagText}>CLEAN</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      <View style={styles.textArea}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>THE PROBLEM</Text>
        <Text style={[styles.title, { color: theme.text }]}>Most mornings{"\n"}start messy.</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          You wake up, check your phone, rush into the day, and leave your room behind. BedVibe helps you turn one small action into a daily win.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="Continue" onPress={onNext} theme={theme} testId="ob-problem-next" />
      </View>
    </View>
  );
}

// ── Screen 3: Value ───────────────────────────────────────────────────────────
function ValueStep({ theme, onNext }: StepProps & { onNext: () => void }) {
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState<number>(0);

  useEffect(() => {
    Animated.timing(scoreAnim, {
      toValue: 87,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = scoreAnim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => scoreAnim.removeListener(id);
  }, [scoreAnim]);

  return (
    <View style={styles.stepInner}>
      <View style={styles.heroArea}>
        <View style={[styles.scoreCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={styles.scoreTopRow}>
            <View style={[styles.scoreBadge, { backgroundColor: theme.accentSoft }]}>
              <Sparkles size={14} color={theme.accent} fill={theme.accent} />
              <Text style={[styles.scoreBadgeText, { color: theme.accent }]}>BED SCORE</Text>
            </View>
          </View>
          <Text style={[styles.bigScore, { color: theme.text }]}>{displayScore}</Text>
          <Text style={[styles.scoreTitle, { color: theme.text }]}>Champion of Tidy</Text>
          <Text style={[styles.scoreMessage, { color: theme.textMuted }]}>
            You already won the morning. Now go win the day.
          </Text>
          <View style={[styles.scoreDivider, { backgroundColor: theme.border }]} />
          <View style={styles.scoreStats}>
            <ScoreStat label="Edges" value={92} theme={theme} />
            <ScoreStat label="Symmetry" value={84} theme={theme} />
            <ScoreStat label="Smooth" value={85} theme={theme} />
          </View>
        </View>
      </View>

      <View style={styles.textArea}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>HOW IT WORKS</Text>
        <Text style={[styles.title, { color: theme.text }]}>One photo.{"\n"}One score. One small win.</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Snap your bed every morning and BedVibe gives you a score, a funny title, and a motivational message to start your day.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="That's fun" onPress={onNext} theme={theme} testId="ob-value-next" />
      </View>
    </View>
  );
}

function ScoreStat({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof getTheme> }) {
  return (
    <View style={styles.scoreStat}>
      <Text style={[styles.scoreStatValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.scoreStatLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

// ── Screen 4: Habit ───────────────────────────────────────────────────────────
function HabitStep({ theme, onNext }: StepProps & { onNext: () => void }) {
  const flames = [
    { count: 3, label: "First spark", subtitle: "3 day streak" },
    { count: 7, label: "Week one", subtitle: "7 day streak" },
    { count: 30, label: "Solid habit", subtitle: "30 day streak" },
  ];

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const flameScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <View style={styles.stepInner}>
      <View style={[styles.heroArea, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.streakRow}>
          {flames.map((f, i) => (
            <View
              key={f.count}
              style={[
                styles.streakCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: i === 1 ? flameScale : 1 }] }}>
                <View
                  style={[
                    styles.streakFlame,
                    { backgroundColor: i === 2 ? theme.accent : i === 1 ? theme.warning : theme.accentSoft },
                  ]}
                >
                  <Flame size={22} color="#FFF" fill="#FFF" />
                </View>
              </Animated.View>
              <Text style={[styles.streakCount, { color: theme.text }]}>{f.count}</Text>
              <Text style={[styles.streakLabel, { color: theme.textMuted }]}>{f.subtitle}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.textArea}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>STREAKS</Text>
        <Text style={[styles.title, { color: theme.text }]}>Build a streak{"\n"}you won&apos;t want to lose.</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Every made bed counts. Track your consistency, improve your score, and watch your morning discipline grow.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="I want my streak" onPress={onNext} theme={theme} testId="ob-habit-next" />
      </View>
    </View>
  );
}

// ── Screen 5: Goals ───────────────────────────────────────────────────────────
function GoalsStep({
  theme,
  goals,
  setGoals,
  onNext,
}: StepProps & {
  goals: string[];
  setGoals: (g: string[]) => void;
  onNext: () => void;
}) {
  const toggle = useCallback(
    (id: string) => {
      tapLight();
      if (goals.includes(id)) {
        setGoals(goals.filter((g) => g !== id));
      } else {
        setGoals([...goals, id]);
      }
    },
    [goals, setGoals]
  );

  return (
    <View style={styles.stepInner}>
      <View style={[styles.textArea, { paddingTop: spacing.xl }]}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>YOUR GOAL</Text>
        <Text style={[styles.title, { color: theme.text }]}>What do you want{"\n"}BedVibe to help with?</Text>
        <Text style={[styles.body, { color: theme.textMuted, marginBottom: spacing.lg }]}>
          Pick everything that fits. We&apos;ll personalise BedVibe around it.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.goalsScroll}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((g) => {
          const active = goals.includes(g.id);
          return (
            <Pressable
              key={g.id}
              onPress={() => toggle(g.id)}
              style={({ pressed }) => [
                styles.goalRow,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
              testID={`ob-goal-${g.id}`}
            >
              <Text style={styles.goalEmoji}>{g.emoji}</Text>
              <Text
                style={[
                  styles.goalLabel,
                  { color: active ? theme.background : theme.text },
                ]}
              >
                {g.label}
              </Text>
              <View
                style={[
                  styles.goalCheck,
                  {
                    backgroundColor: active ? theme.background : "transparent",
                    borderColor: active ? theme.background : theme.border,
                  },
                ]}
              >
                {active && <Check size={14} color={theme.primary} />}
              </View>
            </Pressable>
          );
        })}

        {goals.length > 0 && (
          <View style={[styles.confirmCard, { backgroundColor: theme.accentSoft }]}>
            <Sparkles size={16} color={theme.accent} fill={theme.accent} />
            <Text style={[styles.confirmText, { color: theme.text }]}>
              Nice. We&apos;ll personalise your BedVibe around this.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomArea}>
        <PrimaryCTA
          label="Continue"
          onPress={onNext}
          theme={theme}
          disabled={goals.length === 0}
          testId="ob-goals-next"
        />
      </View>
    </View>
  );
}

// ── Screen 6: Reminder ────────────────────────────────────────────────────────
function ReminderStep({
  theme,
  reminderId,
  setReminderId,
  useCustom,
  setUseCustom,
  customHour,
  setCustomHour,
  busy,
  onNext,
}: StepProps & {
  reminderId: string;
  setReminderId: (s: string) => void;
  useCustom: boolean;
  setUseCustom: (b: boolean) => void;
  customHour: number;
  setCustomHour: (n: number) => void;
  busy: boolean;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepInner}>
      <View style={[styles.textArea, { paddingTop: spacing.xl }]}>
        <View style={[styles.iconBubble, { backgroundColor: "rgba(255,255,255,0.6)", marginBottom: spacing.lg }]}>
          <Bell size={28} color={theme.primary} />
        </View>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>MORNING REMINDER</Text>
        <Text style={[styles.title, { color: theme.text }]}>When should{"\n"}BedVibe nudge you?</Text>
        <Text style={[styles.body, { color: theme.textMuted, marginBottom: spacing.lg }]}>
          Pick a morning reminder so you never forget to make your bed and protect your streak.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reminderRow}>
          {REMINDER_OPTIONS.map((r) => {
            const active = !useCustom && reminderId === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  tapLight();
                  setUseCustom(false);
                  setReminderId(r.id);
                }}
                style={[
                  styles.reminderChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Clock size={14} color={active ? theme.background : theme.text} />
                <Text style={[styles.reminderChipText, { color: active ? theme.background : theme.text }]}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            tapLight();
            setUseCustom(true);
          }}
          style={[
            styles.customRow,
            {
              backgroundColor: useCustom ? theme.primary : theme.surface,
              borderColor: useCustom ? theme.primary : theme.border,
            },
          ]}
        >
          <Text style={[styles.customLabel, { color: useCustom ? theme.background : theme.text }]}>
            Custom time
          </Text>
          <View style={[styles.customTimePill, { backgroundColor: useCustom ? theme.background : theme.surfaceAlt }]}>
            <Pressable
              onPress={() => {
                tapLight();
                setUseCustom(true);
                setCustomHour(Math.max(0, customHour - 1));
              }}
              hitSlop={10}
            >
              <Text style={[styles.customStep, { color: useCustom ? theme.primary : theme.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.customTime, { color: useCustom ? theme.primary : theme.text }]}>
              {String(customHour).padStart(2, "0")}:00
            </Text>
            <Pressable
              onPress={() => {
                tapLight();
                setUseCustom(true);
                setCustomHour(Math.min(23, customHour + 1));
              }}
              hitSlop={10}
            >
              <Text style={[styles.customStep, { color: useCustom ? theme.primary : theme.text }]}>+</Text>
            </Pressable>
          </View>
        </Pressable>

        <View style={[styles.permissionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.permIcon, { backgroundColor: theme.accentSoft }]}>
            <Bell size={18} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.permTitle, { color: theme.text }]}>Allow notifications</Text>
            <Text style={[styles.permBody, { color: theme.textMuted }]}>
              We&apos;ll only remind you about your morning routine and bedtime wind down.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <PrimaryCTA
          label={busy ? "Setting up..." : "Set Reminder"}
          onPress={onNext}
          theme={theme}
          disabled={busy}
          testId="ob-reminder-next"
        />
      </View>
    </View>
  );
}

// ── Screen 7: Challenge ───────────────────────────────────────────────────────
function ChallengeStep({ theme, onNext }: StepProps & { onNext: () => void }) {
  return (
    <View style={styles.stepInner}>
      <View style={styles.heroArea}>
        <View style={[styles.challengeCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={[styles.challengeIcon, { backgroundColor: theme.accent }]}>
            <Target size={26} color="#FFF" />
          </View>
          <Text style={[styles.challengeBadge, { color: theme.accent }]}>YOUR FIRST CHALLENGE</Text>
          <Text style={[styles.challengeTitle, { color: theme.text }]}>Morning Reset</Text>
          <Text style={[styles.challengeBody, { color: theme.textMuted }]}>
            Make your bed before touching social media.
          </Text>
          <View style={[styles.challengeDivider, { backgroundColor: theme.border }]} />
          <View style={styles.challengeMetaRow}>
            <View style={styles.challengeMeta}>
              <Sun size={14} color={theme.accent} />
              <Text style={[styles.challengeMetaText, { color: theme.textMuted }]}>Tomorrow morning</Text>
            </View>
            <View style={styles.challengeMeta}>
              <Sparkles size={14} color={theme.accent} />
              <Text style={[styles.challengeMetaText, { color: theme.textMuted }]}>Unlock first score</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.textArea}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>READY?</Text>
        <Text style={[styles.title, { color: theme.text }]}>Your first challenge{"\n"}is ready.</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Tomorrow morning, make your bed, take a photo, and unlock your first Bed Score.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="I'm ready" onPress={onNext} theme={theme} testId="ob-challenge-next" />
      </View>
    </View>
  );
}

// ── Screen 8: Premium Intro ───────────────────────────────────────────────────
function PremiumIntroStep({
  theme,
  onUnlock,
  onSkip,
}: StepProps & { onUnlock: () => void; onSkip: () => void }) {
  const benefits = [
    { icon: Zap, title: "Smart wake alarm", body: "A gentle alarm that nudges you to make your bed first." },
    { icon: Trophy, title: "Leaderboard access", body: "Compete with premium users and show your best Bed Score." },
    { icon: BookOpen, title: "Bedtime stories", body: "Relax with calming stories before sleep." },
    { icon: Headphones, title: "Relaxation audio", body: "Peaceful sounds, breathing sessions, short night routines." },
    { icon: Flame, title: "Advanced streaks", body: "See how your morning routine improves over time." },
    { icon: Palette, title: "Premium themes", body: "Beautiful scoring screens, fun titles, custom vibes." },
  ];

  return (
    <View style={styles.stepInner}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconBubble, { backgroundColor: "rgba(255,255,255,0.6)", marginBottom: spacing.lg }]}>
          <Crown size={28} color={theme.accent} fill={theme.accent} />
        </View>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>BEDVIBE PREMIUM</Text>
        <Text style={[styles.title, { color: theme.text }]}>Want the full{"\n"}BedVibe experience?</Text>
        <Text style={[styles.body, { color: theme.textMuted, marginBottom: spacing.lg }]}>
          Premium helps you build the full morning and night routine.
        </Text>

        {benefits.map((b) => (
          <View
            key={b.title}
            style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: theme.accentSoft }]}>
              <b.icon size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.benefitTitle, { color: theme.text }]}>{b.title}</Text>
              <Text style={[styles.benefitBody, { color: theme.textMuted }]}>{b.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="Unlock BedVibe Premium" onPress={onUnlock} theme={theme} testId="ob-premium-unlock" />
        <SecondaryCTA label="Continue with free version" onPress={onSkip} theme={theme} testId="ob-premium-skip" />
      </View>
    </View>
  );
}

// ── Screen 9: Paywall ─────────────────────────────────────────────────────────
type Plan = "yearly" | "monthly";

function PaywallStep({
  theme: _theme,
  onPurchase,
  onSkip,
}: StepProps & { onPurchase: () => void; onSkip: () => void }) {
  const [plan, setPlan] = useState<Plan>("yearly");
  return (
    <View style={styles.stepInner}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconBubble, { backgroundColor: "rgba(255,255,255,0.12)", marginBottom: spacing.lg }]}>
          <Crown size={28} color="#F5C97B" fill="#F5C97B" />
        </View>
        <Text style={[styles.eyebrow, { color: "rgba(255,255,255,0.6)" }]}>UNLOCK PREMIUM</Text>
        <Text style={[styles.title, { color: "#FFFFFF" }]}>Better mornings{"\n"}for less than a snack.</Text>
        <Text style={[styles.body, { color: "rgba(255,255,255,0.7)", marginBottom: spacing.xl }]}>
          Smart alarms, bedtime stories, relaxation audio, leaderboard access, premium themes, and advanced streak tracking.
        </Text>

        <Pressable
          onPress={() => {
            tapLight();
            setPlan("yearly");
          }}
          style={[
            styles.planRow,
            {
              backgroundColor: plan === "yearly" ? "#FFFFFF" : "rgba(255,255,255,0.06)",
              borderColor: plan === "yearly" ? "#FFFFFF" : "rgba(255,255,255,0.18)",
            },
          ]}
        >
          <View style={styles.planTopRow}>
            <Text style={[styles.planTitle, { color: plan === "yearly" ? "#0E1024" : "#FFFFFF" }]}>Yearly</Text>
            <View style={[styles.planBadgeBest, { backgroundColor: "#F5C97B" }]}>
              <Text style={styles.planBadgeBestText}>BEST VALUE</Text>
            </View>
          </View>
          <View style={styles.planPriceRow}>
            <Text style={[styles.planPrice, { color: plan === "yearly" ? "#0E1024" : "#FFFFFF" }]}>$29.99</Text>
            <Text style={[styles.planPer, { color: plan === "yearly" ? "rgba(14,16,36,0.6)" : "rgba(255,255,255,0.6)" }]}>
              / year
            </Text>
          </View>
          <Text style={[styles.planNote, { color: plan === "yearly" ? "rgba(14,16,36,0.7)" : "rgba(255,255,255,0.7)" }]}>
            Just $2.50/month · Includes 7-day free trial
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            tapLight();
            setPlan("monthly");
          }}
          style={[
            styles.planRow,
            {
              backgroundColor: plan === "monthly" ? "#FFFFFF" : "rgba(255,255,255,0.06)",
              borderColor: plan === "monthly" ? "#FFFFFF" : "rgba(255,255,255,0.18)",
            },
          ]}
        >
          <View style={styles.planTopRow}>
            <Text style={[styles.planTitle, { color: plan === "monthly" ? "#0E1024" : "#FFFFFF" }]}>Monthly</Text>
          </View>
          <View style={styles.planPriceRow}>
            <Text style={[styles.planPrice, { color: plan === "monthly" ? "#0E1024" : "#FFFFFF" }]}>$3.99</Text>
            <Text style={[styles.planPer, { color: plan === "monthly" ? "rgba(14,16,36,0.6)" : "rgba(255,255,255,0.6)" }]}>
              / month
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          onPress={onPurchase}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: "#F5C97B", transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          testID="ob-paywall-cta"
        >
          <Text style={[styles.ctaText, { color: "#0E1024" }]}>Start 7 Day Free Trial</Text>
          <ChevronRight size={18} color="#0E1024" />
        </Pressable>
        <Text style={styles.paywallFinePrint}>
          Cancel anytime. We&apos;ll remind you before your trial ends.
        </Text>
        <SecondaryCTA label="Not now" onPress={onSkip} theme={_theme} dark testId="ob-paywall-skip" />
      </View>
    </View>
  );
}

// ── Screen 10: One-Time Offer ─────────────────────────────────────────────────
function OfferStep({
  theme: _theme,
  onClaim,
  onSkip,
}: StepProps & { onClaim: () => void; onSkip: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  const features = [
    "Smart wake alarm",
    "Bedtime stories",
    "Relaxation audio",
    "Leaderboard access",
    "Advanced streaks",
    "Premium themes",
  ];

  return (
    <View style={styles.stepInner}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.offerBadge, { backgroundColor: "#F5C97B" }]}>
          <Wand2 size={14} color="#0E1024" />
          <Text style={styles.offerBadgeText}>ONE-TIME OFFER</Text>
        </View>
        <Text style={[styles.title, { color: "#FFFFFF", marginTop: spacing.lg }]}>
          Wait. Your BedVibe{"\n"}offer is unlocked.
        </Text>
        <Text style={[styles.body, { color: "rgba(255,255,255,0.7)", marginBottom: spacing.lg }]}>
          Get BedVibe Premium for $20 for your first year. This offer is only available now — it won&apos;t return after your trial.
        </Text>

        <Animated.View style={[styles.offerCard, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={["#F5C97B", "#FF8A65"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.offerCardInner}
          >
            <View style={styles.offerPriceRow}>
              <Text style={styles.offerPriceStrike}>$29.99</Text>
              <Text style={styles.offerPriceBig}>$20</Text>
              <Text style={styles.offerPricePer}>/ first year</Text>
            </View>
            <Text style={styles.offerCardTitle}>Full Premium Access</Text>
            <View style={styles.offerFeatures}>
              {features.map((f) => (
                <View key={f} style={styles.offerFeatureRow}>
                  <Check size={14} color="#0E1024" />
                  <Text style={styles.offerFeatureText}>{f}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.offerCompare}>
          <Text style={styles.offerCompareLabel}>Regular yearly price</Text>
          <Text style={styles.offerCompareStrike}>$29.99</Text>
        </View>
        <View style={styles.offerCompare}>
          <Text style={[styles.offerCompareLabel, { color: "#F5C97B" }]}>Today only</Text>
          <Text style={styles.offerCompareGold}>$20</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          onPress={onClaim}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: "#F5C97B", transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          testID="ob-offer-claim"
        >
          <Text style={[styles.ctaText, { color: "#0E1024" }]}>Claim $20 Yearly Offer</Text>
          <ChevronRight size={18} color="#0E1024" />
        </Pressable>
        <Text style={styles.paywallFinePrint}>
          One-time introductory offer. Skip and you can continue free or start the regular trial later.
        </Text>
        <SecondaryCTA label="Skip offer" onPress={onSkip} theme={_theme} dark testId="ob-offer-skip" />
      </View>
    </View>
  );
}

// ── Screen 11: Ready ──────────────────────────────────────────────────────────
function ReadyStep({ theme, onFinish }: StepProps & { onFinish: () => void }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, [float]);
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.stepInner}>
      <View style={styles.heroArea}>
        <Animated.View style={[styles.readyCircle, { backgroundColor: theme.accentSoft, transform: [{ translateY }] }]}>
          <View style={[styles.readyCircleInner, { backgroundColor: theme.accent }]}>
            <Moon size={42} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.textArea}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>YOU&apos;RE ALL SET</Text>
        <Text style={[styles.title, { color: theme.text }]}>You&apos;re ready{"\n"}to vibe.</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Make your bed tomorrow morning, take your first photo, and unlock your Bed Score. We&apos;ll be here.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <PrimaryCTA label="Go to BedVibe" onPress={onFinish} theme={theme} testId="ob-ready-finish" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  progressWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  progressTrack: {
    flexDirection: "row",
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepWrap: {
    flex: 1,
  },
  stepInner: {
    flex: 1,
  },
  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  textArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  bottomArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 18,
    borderRadius: radius.pill,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  secondaryCta: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  secondaryCtaText: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bed illustration
  bedIllustration: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.55,
    maxWidth: 320,
    maxHeight: 240,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  bedHeadboard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 14,
    height: 28,
    borderRadius: 8,
  },
  bedPillow: {
    position: "absolute",
    left: 28,
    top: 50,
    width: 56,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
  },
  bedPillow2: {
    left: 92,
  },
  bedBlanket: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 88,
    height: 70,
    borderRadius: 10,
  },
  bedBlanketFold: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 130,
    height: 16,
    borderRadius: 4,
  },
  bedFrame: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
  },
  sparkle: {
    position: "absolute",
  },
  sparkleTL: { top: -10, left: -10 },
  sparkleTR: { top: 10, right: -16 },
  sparkleBR: { bottom: -10, right: 10 },
  // Compare
  compareWrap: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.55,
    maxWidth: 320,
    maxHeight: 240,
    position: "relative",
  },
  compareCard: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  messyBlanket: {
    position: "absolute",
    left: 12,
    top: 60,
    width: 180,
    height: 60,
    borderRadius: 8,
  },
  messyBlanket2: {
    position: "absolute",
    left: 60,
    top: 100,
    width: 160,
    height: 50,
    borderRadius: 8,
  },
  tag: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  // Score card
  scoreCard: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  scoreTopRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  bigScore: {
    fontSize: 72,
    fontWeight: "800",
    letterSpacing: -3,
    lineHeight: 76,
  },
  scoreTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  scoreMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreDivider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  scoreStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreStat: {
    alignItems: "flex-start",
  },
  scoreStatValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  scoreStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2,
  },
  // Streaks
  streakRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  streakCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 2,
  },
  streakFlame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  // Goals
  goalsScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: 10,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  goalEmoji: {
    fontSize: 22,
  },
  goalLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  goalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  confirmText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  // Reminder
  reminderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  reminderChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  reminderChipText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  customLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  customTimePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  customStep: {
    fontSize: 22,
    fontWeight: "800",
    width: 18,
    textAlign: "center",
  },
  customTime: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.4,
    minWidth: 56,
    textAlign: "center",
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  permIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  permTitle: { fontSize: 14, fontWeight: "800" },
  permBody: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  // Challenge
  challengeCard: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  challengeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  challengeBadge: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  challengeTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  challengeBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  challengeDivider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  challengeMetaRow: {
    gap: 10,
  },
  challengeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  challengeMetaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Premium intro
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  benefitBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Paywall
  planRow: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  planBadgeBest: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  planBadgeBestText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0E1024",
    letterSpacing: 0.6,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  planPer: {
    fontSize: 13,
    fontWeight: "600",
  },
  planNote: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  paywallFinePrint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  // Offer
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  offerBadgeText: {
    color: "#0E1024",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  offerCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  offerCardInner: {
    padding: spacing.xl,
  },
  offerPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: spacing.sm,
  },
  offerPriceStrike: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(14,16,36,0.5)",
    textDecorationLine: "line-through",
  },
  offerPriceBig: {
    fontSize: 56,
    fontWeight: "800",
    color: "#0E1024",
    letterSpacing: -2,
  },
  offerPricePer: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0E1024",
  },
  offerCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0E1024",
    marginBottom: spacing.md,
  },
  offerFeatures: {
    gap: 6,
  },
  offerFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  offerFeatureText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0E1024",
  },
  offerCompare: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  offerCompareLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  offerCompareStrike: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "line-through",
  },
  offerCompareGold: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F5C97B",
    letterSpacing: -0.4,
  },
  // Ready
  readyCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  readyCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
