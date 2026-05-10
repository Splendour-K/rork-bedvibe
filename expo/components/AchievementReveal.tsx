import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { ACHIEVEMENT_MAP, AchievementId } from "@/lib/achievements";
import { getTheme, radius, spacing } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";

interface Props {
  ids: AchievementId[];
  onDismiss: () => void;
  theme: ReturnType<typeof getTheme>;
}

export default function AchievementReveal({ ids, onDismiss, theme }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  if (ids.length === 0) return null;

  const items = ids.map((id) => ACHIEVEMENT_MAP[id]).filter(Boolean);
  if (items.length === 0) return null;

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: anim,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={theme.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { shadowColor: theme.shadow }]}
      >
        <View style={[styles.eyebrow, { backgroundColor: theme.text }]}>
          <Sparkles size={11} color={theme.background} />
          <Text style={[styles.eyebrowText, { color: theme.background }]}>
            {items.length === 1 ? "ACHIEVEMENT UNLOCKED" : `${items.length} ACHIEVEMENTS UNLOCKED`}
          </Text>
        </View>
        <View style={styles.list}>
          {items.map((a) => (
            <View key={a.id} style={[styles.row, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>{a.title}</Text>
                <Text style={[styles.body, { color: theme.textMuted }]} numberOfLines={2}>
                  {a.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: theme.text, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          testID="achievement-dismiss"
        >
          <Text style={[styles.ctaText, { color: theme.background }]}>Awesome</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: "15%",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 12,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  list: {
    gap: 10,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
