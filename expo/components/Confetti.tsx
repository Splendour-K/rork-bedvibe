import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

interface Piece {
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  size: number;
  drift: number;
  shape: "rect" | "circle";
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  colors?: readonly string[];
  durationMs?: number;
}

const DEFAULT_COLORS = ["#FF8A65", "#B294E8", "#F5C97B", "#7BD8B0", "#8FA8FF", "#FF7B9A"] as const;

export default function Confetti({ active, count = 36, colors = DEFAULT_COLORS, durationMs = 2400 }: ConfettiProps) {
  const { width, height } = Dimensions.get("window");

  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const seed = Math.random();
      return {
        left: Math.random() * width,
        delay: Math.random() * 400,
        duration: durationMs * (0.7 + Math.random() * 0.6),
        rotate: Math.random() * 360,
        color: colors[i % colors.length],
        size: 6 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 120,
        shape: seed > 0.5 ? "rect" : "circle",
      };
    });
  }, [count, width, durationMs, colors]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={`c-${i}`} piece={p} screenH={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, screenH }: { piece: Piece; screenH: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [fall, spin, piece.duration, piece.delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, screenH + 40] });
  const translateX = fall.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: [`${piece.rotate}deg`, `${piece.rotate + 360}deg`] });
  const opacity = fall.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: piece.left,
        top: 0,
        width: piece.size,
        height: piece.shape === "rect" ? piece.size * 1.4 : piece.size,
        backgroundColor: piece.color,
        borderRadius: piece.shape === "circle" ? piece.size / 2 : 2,
        transform: [{ translateY }, { translateX }, { rotate }],
        opacity,
      }}
    />
  );
}
