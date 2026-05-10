import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const REMINDER_IDENTIFIER = "bedvibe-daily-reminder";
const STREAK_WARNING_IDENTIFIER = "bedvibe-streak-warning";
const ALARM_IDENTIFIER_PREFIX = "bedvibe-alarm-";

const COPY = [
  "Make your bed, make your day ✨",
  "Two minutes for a calmer morning.",
  "Your bed is waiting for its glow-up.",
  "A made bed is a made mind.",
  "Snap today's bed and unlock your vibe.",
];

export const isNotificationsSupported = Platform.OS !== "web";

export async function ensurePermission(): Promise<boolean> {
  if (!isNotificationsSupported) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch (e) {
    console.log("[notifications] permission error", e);
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isNotificationsSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier === REMINDER_IDENTIFIER || n.identifier.startsWith(REMINDER_IDENTIFIER)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.log("[notifications] cancel error", e);
  }
}

/**
 * Schedule a daily evening notification warning the user their streak is at risk.
 * Fires at 20:30 every day. Call this whenever the user has an active streak but
 * hasn't uploaded today. Cancel it via cancelStreakWarning() once they upload.
 */
export async function scheduleStreakWarning(streak: number): Promise<boolean> {
  if (!isNotificationsSupported) return false;
  try {
    // Cancel any existing one first
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier === STREAK_WARNING_IDENTIFIER) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_WARNING_IDENTIFIER,
      content: {
        title: streak > 0 ? `🔥 ${streak}-day streak at risk!` : "Don't forget your bed photo!",
        body: "Make your bed, take a photo, and protect your streak before midnight.",
        sound: "default",
        data: { type: "streak_warning" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 30,
      },
    });
    console.log("[notifications] streak warning scheduled");
    return true;
  } catch (e) {
    console.log("[notifications] streak warning error", e);
    return false;
  }
}

export async function cancelStreakWarning(): Promise<void> {
  if (!isNotificationsSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier === STREAK_WARNING_IDENTIFIER) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.log("[notifications] cancel streak warning error", e);
  }
}

export async function scheduleDailyReminder(time: string): Promise<boolean> {
  if (!isNotificationsSupported) return false;
  const [hStr, mStr] = time.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;

  await cancelDailyReminder();

  const body = COPY[Math.floor(Math.random() * COPY.length)];
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: "BedVibe",
        body,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    console.log("[notifications] scheduled daily at", time);
    return true;
  } catch (e) {
    console.log("[notifications] schedule error", e);
    return false;
  }
}

export function configureNotifications(): void {
  if (!isNotificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function cancelAlarm(): Promise<void> {
  if (!isNotificationsSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(ALARM_IDENTIFIER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.log("[notifications] cancel alarm error", e);
  }
}

export async function scheduleWakeAlarm(time: string, days: number[]): Promise<boolean> {
  if (!isNotificationsSupported) return false;
  if (days.length === 0) return false;
  const [hStr, mStr] = time.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;

  await cancelAlarm();
  try {
    for (const d of days) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${ALARM_IDENTIFIER_PREFIX}${d}`,
        content: {
          title: "Rise & make your bed ✨",
          body: "Two minutes for a calmer day. Tap to start your bed routine.",
          sound: "default",
          data: { type: "alarm" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: d + 1,
          hour,
          minute,
        },
      });
    }
    console.log("[notifications] scheduled alarm", time, days);
    return true;
  } catch (e) {
    console.log("[notifications] schedule alarm error", e);
    return false;
  }
}
