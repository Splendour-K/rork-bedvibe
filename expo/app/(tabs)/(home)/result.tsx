import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ShareCard, { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "@/components/ShareCard";
import { shareEntry } from "@/lib/share-card";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Home, RotateCcw, Share2, Sparkles, WifiOff } from "lucide-react-native";
import Confetti from "@/components/Confetti";
import AchievementReveal from "@/components/AchievementReveal";
import { AchievementId } from "@/lib/achievements";
import { resizeForUpload } from "@/lib/resize-for-upload";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { BedEntry, getTitleAndAffirmation } from "@/types";
import ScoreRing from "@/components/ScoreRing";
import { SafeAreaView } from "react-native-safe-area-context";
import { notifySuccess, tapLight } from "@/lib/haptics";
import { TOOLKIT_URL, SECRET_KEY, VISION_MODEL, AI_TIMEOUT_MS } from "@/lib/ai";

interface BedAnalysis {
  score: number;
  edgesScore: number;
  symmetryScore: number;
  smoothnessScore: number;
  feedback: string;
}

type PipelineStage = "resize" | "api-call" | "parse" | "save";

function classifyError(e: unknown, stage: PipelineStage): string {
  const msg = e instanceof Error ? e.message : String(e ?? "Unknown error");

  if (msg.includes("IMAGE_TOO_LARGE")) {
    return "The photo is still too large after compression. Try a different image.";
  }
  if (msg.includes("AbortError") || msg.includes("timed out") || msg.includes("Timeout")) {
    return `Analysis timed out (${stage}). Your connection might be slow — please try again.`;
  }
  if (msg.includes("Network") || msg.includes("fetch") || msg.includes("ECONN")) {
    return "Could not reach the analysis service. Check your internet and try again.";
  }
  if (msg.startsWith("API 4")) {
    return `Analysis service unavailable (${msg.slice(0, 60)}). Please try again in a moment.`;
  }
  if (msg.startsWith("API 5")) {
    return "The analysis service is temporarily overloaded. Please try again.";
  }
  if (msg.includes("Empty response") || msg.includes("JSON")) {
    return "The AI returned an unexpected response. Please try a different photo.";
  }
  if (stage === "resize") {
    return `Could not prepare the photo for analysis: ${msg.slice(0, 80)}`;
  }

  return `Could not analyze your bed (${stage}). Please try again.`;
}

export default function ResultScreen() {
  const { imageUri, entryId } = useLocalSearchParams<{ imageUri?: string; entryId?: string }>();
  const router = useRouter();
  const { entries, addEntry, getTodayKey, profile, consumePendingAchievements } = useApp();
  const theme = getTheme(profile.theme);

  const [entry, setEntry] = useState<BedEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("Preparing your photo…");
  const [error, setError] = useState<string | null>(null);
  const successFiredRef = useRef<boolean>(false);
  const [confettiOn, setConfettiOn] = useState<boolean>(false);
  const [revealIds, setRevealIds] = useState<AchievementId[]>([]);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const shareRef = useRef<View | null>(null);

  /** Guard ref — prevents the effect from firing more than once per mount. */
  const analysisFiredRef = useRef(false);

  /** Stable refs so the one-shot effect below doesn't need them in its dep array */
  const addEntryRef = useRef(addEntry);
  const getTodayKeyRef = useRef(getTodayKey);
  useEffect(() => { addEntryRef.current = addEntry; }, [addEntry]);
  useEffect(() => { getTodayKeyRef.current = getTodayKey; }, [getTodayKey]);

  const analyzeBed = useCallback(async (uri: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setLoadingStage("Preparing your photo…");

    let stage: PipelineStage = "resize";

    try {
      // --- Stage 1: Resize & encode the image ---
      console.log("[result] resizing image", { uri: uri.slice(0, 60) });
      const { base64 } = await resizeForUpload(uri);
      console.log("[result] resized OK, base64 length", base64.length);

      // --- Stage 2: Call the AI vision model ---
      stage = "api-call";
      setLoadingStage("Analyzing your bed…");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      console.log("[result] calling AI model", VISION_MODEL);

      const response = await fetch(
        `${TOOLKIT_URL}/v2/vercel/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SECRET_KEY}`,
          },
          body: JSON.stringify({
            model: VISION_MODEL,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this photo of a bed and rate its neatness. Be encouraging and fair. Return ONLY a JSON object with these exact fields (numbers 0-100):
{"score": <overall 0-100>, "edgesScore": <edges 0-100>, "symmetryScore": <symmetry 0-100>, "smoothnessScore": <smoothness 0-100>, "feedback": "<brief fun sentence>"}`,
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${base64}` },
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timer);
      console.log("[result] AI response status", response.status);

      if (!response.ok) {
        const errText = await response.text().catch(() => "(could not read body)");
        console.log("[result] AI error body", errText.slice(0, 300));
        throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`);
      }

      // --- Stage 3: Parse the response ---
      stage = "parse";
      setLoadingStage("Reading your results…");

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      console.log("[result] AI raw content", content.slice(0, 200));

      if (!content) throw new Error("Empty response from AI");

      let parsed: Partial<BedAnalysis>;
      try {
        parsed = JSON.parse(content) as Partial<BedAnalysis>;
      } catch {
        // Sometimes the model wraps JSON in markdown fences
        const cleaned = content.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
        parsed = JSON.parse(cleaned) as Partial<BedAnalysis>;
      }

      const clamp = (v: unknown): number =>
        Math.round(Math.min(100, Math.max(0, Number(v) || 0)));

      const score = clamp(parsed.score) || 50;
      const { title, affirmation } = getTitleAndAffirmation(score);

      // --- Stage 4: Save the entry ---
      stage = "save";
      setLoadingStage("Saving your score…");

      const newEntry: BedEntry = {
        id: `${Date.now()}`,
        date: getTodayKeyRef.current(),
        imageUri: uri,
        score,
        title,
        affirmation,
        edgesScore: clamp(parsed.edgesScore) || score,
        symmetryScore: clamp(parsed.symmetryScore) || score,
        smoothnessScore: clamp(parsed.smoothnessScore) || score,
      };

      await addEntryRef.current(newEntry);
      setEntry(newEntry);
      console.log("[result] analysis complete, score", score);
    } catch (e) {
      console.log("[result] analysis failed at stage", stage, e);
      setError(classifyError(e, stage));
      // Allow retry by resetting the guard
      analysisFiredRef.current = false;
    } finally {
      setLoading(false);
    }
  }, []); // intentionally empty — uses stable refs above

  /** One-shot: start analysis when imageUri is available */
  useEffect(() => {
    if (!imageUri || analysisFiredRef.current) return;
    analysisFiredRef.current = true;
    analyzeBed(imageUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri]); // analyzeBed is stable (empty deps), safe to omit

  /** Look up an existing entry by id (e.g. viewing history) */
  useEffect(() => {
    if (!entryId) return;
    const found = entries.find((e) => e.id === entryId) ?? null;
    setEntry(found);
  }, [entryId, entries]);

  useEffect(() => {
    if (entry && !successFiredRef.current) {
      successFiredRef.current = true;
      notifySuccess();
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (!entryId) {
        const newly = consumePendingAchievements();
        setConfettiOn(true);
        setTimeout(() => setConfettiOn(false), 2800);
        if (newly.length > 0) {
          setTimeout(() => setRevealIds(newly), 700);
        }
      }
    }
  }, [entry, fadeIn, entryId, consumePendingAchievements]);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [loading, shimmer]);

  const handleShare = async (): Promise<void> => {
    if (!entry) return;
    tapLight();
    await shareEntry(entry, shareRef);
  };

  if (loading) {
    const shimmerTranslate = shimmer.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    });
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.fill} edges={["top", "bottom"]}>
          <View style={styles.loadingContent}>
            <Sparkles size={32} color={theme.text} />
            <Text style={[styles.loadingTitle, { color: theme.text }]}>
              Analyzing your vibe
            </Text>
            <Text style={[styles.loadingBody, { color: theme.textMuted }]}>
              {loadingStage}
            </Text>
            <View
              style={[styles.shimmerTrack, { backgroundColor: theme.surfaceAlt }]}
            >
              <Animated.View
                style={[
                  styles.shimmerBar,
                  {
                    backgroundColor: theme.text,
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
            </View>
            <ActivityIndicator color={theme.text} style={{ marginTop: 24 }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.fill, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <View style={styles.errorContent}>
          <View style={styles.errorIconWrap}>
            <WifiOff size={28} color={theme.textMuted} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Hmm, that didn't work
          </Text>
          <Text style={[styles.errorBody, { color: theme.textMuted }]}>
            {error}
          </Text>
          <View style={styles.errorActions}>
            <Pressable
              onPress={() => {
                tapLight();
                router.replace("/(tabs)/(home)");
              }}
              style={({ pressed }) => [
                styles.errorBtnGhost,
                {
                  borderColor: theme.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Home size={18} color={theme.text} />
              <Text style={[styles.errorBtnGhostText, { color: theme.text }]}>
                Go home
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                tapLight();
                if (imageUri) analyzeBed(imageUri);
              }}
              style={({ pressed }) => [
                styles.errorBtn,
                {
                  backgroundColor: theme.text,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              testID="retry"
            >
              <RotateCcw size={18} color={theme.background} />
              <Text
                style={[styles.errorBtnText, { color: theme.background }]}
              >
                Try again
              </Text>
            </Pressable>
          </View>
          {imageUri ? (
            <View style={styles.errorPreview}>
              <Image
                source={{ uri: imageUri }}
                style={styles.errorPreviewImage}
                resizeMode="cover"
              />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView
        style={[styles.fill, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <View style={styles.errorContent}>
          <Text style={[styles.errorBody, { color: theme.textMuted }]}>
            No result found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <Confetti active={confettiOn} colors={theme.ringGradient} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: entry.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0)", theme.background]}
            style={styles.imageFade}
          />
          <SafeAreaView style={styles.imageTopBar} edges={["top"]}>
            <Pressable
              onPress={() => {
                tapLight();
                router.replace("/(tabs)/(home)");
              }}
              style={styles.imageBackBtn}
              testID="back-home-top"
            >
              <Home size={20} color="#FFF" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={styles.imageBackBtn}
              testID="share-top"
            >
              <Share2 size={20} color="#FFF" />
            </Pressable>
          </SafeAreaView>
        </View>

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [
              {
                translateY: fadeIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.contentWrap}>
            <View style={styles.ringWrap}>
              <ScoreRing score={entry.score} size={200} strokeWidth={16} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>
              {entry.title}
            </Text>
            <Text style={[styles.affirm, { color: theme.textMuted }]}>
              {entry.affirmation}
            </Text>

            <View
              style={[
                styles.breakdownCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <View style={styles.breakdownHeader}>
                <Text style={[styles.breakdownTitle, { color: theme.text }]}>
                  Breakdown
                </Text>
                <View
                  style={[
                    styles.dateBadge,
                    { backgroundColor: theme.surfaceAlt },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateBadgeText,
                      { color: theme.textMuted },
                    ]}
                  >
                    {entry.date}
                  </Text>
                </View>
              </View>
              <BreakdownRow
                label="Edges"
                value={entry.edgesScore}
                theme={theme}
              />
              <BreakdownRow
                label="Symmetry"
                value={entry.symmetryScore}
                theme={theme}
              />
              <BreakdownRow
                label="Smoothness"
                value={entry.smoothnessScore}
                theme={theme}
                last
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.actionPrimary,
                  {
                    backgroundColor: theme.text,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                testID="share-bed"
              >
                <Share2 size={18} color={theme.background} />
                <Text
                  style={[
                    styles.actionPrimaryText,
                    { color: theme.background },
                  ]}
                >
                  Share my vibe
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  tapLight();
                  router.replace("/(tabs)/(home)");
                }}
                style={({ pressed }) => [
                  styles.actionGhost,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Home size={18} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      <View style={styles.offscreen} pointerEvents="none">
        <View
          ref={shareRef}
          collapsable={false}
          style={{ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }}
        >
          <ShareCard entry={entry} userName={profile.name} />
        </View>
      </View>
      {revealIds.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.35)" },
            ]}
          />
          <AchievementReveal
            ids={revealIds}
            theme={theme}
            onDismiss={() => {
              tapLight();
              setRevealIds([]);
            }}
          />
        </View>
      )}
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  theme,
  last,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof getTheme>;
  last?: boolean;
}) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: value,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, fillAnim]);
  const widthInterp = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });
  return (
    <View
      style={[
        breakdownStyles.row,
        last
          ? null
          : {
              borderBottomColor: theme.border,
              borderBottomWidth: StyleSheet.hairlineWidth,
            },
      ]}
    >
      <Text style={[breakdownStyles.label, { color: theme.text }]}>
        {label}
      </Text>
      <View
        style={[
          breakdownStyles.barTrack,
          { backgroundColor: theme.progressBackground },
        ]}
      >
        <Animated.View
          style={[
            breakdownStyles.barFill,
            { backgroundColor: theme.text, width: widthInterp },
          ]}
        />
      </View>
      <Text style={[breakdownStyles.value, { color: theme.text }]}>
        {value}
      </Text>
    </View>
  );
}

const breakdownStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  label: {
    width: 100,
    fontSize: 13,
    fontWeight: "700",
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  value: {
    width: 32,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  imageWrap: { width: "100%", height: 360 },
  image: { width: "100%", height: "100%" },
  imageFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  imageTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  imageBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: -40,
    alignItems: "center",
  },
  ringWrap: { marginBottom: spacing.lg },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 8,
    textAlign: "center",
  },
  affirm: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  breakdownCard: {
    width: "100%",
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  actionPrimaryText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  actionGhost: {
    width: 56,
    paddingVertical: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingBody: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  shimmerTrack: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  shimmerBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  errorContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(128,128,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 300,
  },
  errorActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  errorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
  },
  errorBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
  errorBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  errorBtnGhostText: {
    fontSize: 15,
    fontWeight: "700",
  },
  errorPreview: {
    width: 120,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  errorPreviewImage: {
    width: "100%",
    height: "100%",
  },
  offscreen: {
    position: "absolute",
    left: -10000,
    top: -10000,
    opacity: 0,
  },
});
