import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function tapLight(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapMedium(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function tapHeavy(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function notifySuccess(): void {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function notifyWarning(): void {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function selection(): void {
  if (Platform.OS === "web") return;
  Haptics.selectionAsync().catch(() => {});
}
