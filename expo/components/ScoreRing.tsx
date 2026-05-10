import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useApp } from "@/providers/AppProvider";
import { getTheme } from "@/constants/colors";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  duration?: number;
  showLabel?: boolean;
  testID?: string;
}

const AnimatedCircle = Platform.OS === "web" ? Circle : Animated.createAnimatedComponent(Circle);

export default function ScoreRing({
  score,
  size = 180,
  strokeWidth = 14,
  duration = 1400,
  showLabel = true,
  testID,
}: ScoreRingProps) {
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [webProgress, setWebProgress] = useState<number>(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, score));
    const listener = animated.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
      if (Platform.OS === "web") {
        setWebProgress(value / 100);
      }
    });
    Animated.timing(animated, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animated.removeListener(listener);
  }, [score, duration, animated]);

  const strokeDashoffset = useMemo(() => {
    if (Platform.OS === "web") {
      return circumference * (1 - webProgress);
    }
    return animated.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
    });
  }, [animated, circumference, webProgress]);

  const labelColor = theme.textMuted;

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID ?? "score-ring"}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.ringGradient[0]} />
            <Stop offset="1" stopColor={theme.ringGradient[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.progressBackground}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset as unknown as number}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.score, { color: theme.text, fontSize: size * 0.32 }]}>{displayScore}</Text>
        {showLabel && (
          <Text style={[styles.label, { color: labelColor }]}>BED SCORE</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
});
