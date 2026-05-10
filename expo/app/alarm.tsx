import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Clock, Sparkles, Zap } from "lucide-react-native";
import { useApp } from "@/providers/AppProvider";
import { getTheme, radius, spacing } from "@/constants/colors";
import { ensurePermission, isNotificationsSupported } from "@/lib/notifications";
import { tapLight, tapMedium, notifySuccess } from "@/lib/haptics";

const DAYS = [
  { idx: 0, short: "S", long: "Sunday" },
  { idx: 1, short: "M", long: "Monday" },
  { idx: 2, short: "T", long: "Tuesday" },
  { idx: 3, short: "W", long: "Wednesday" },
  { idx: 4, short: "T", long: "Thursday" },
  { idx: 5, short: "F", long: "Friday" },
  { idx: 6, short: "S", long: "Saturday" },
] as const;

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function describeDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return "Every day";
  if (sorted.length === 0) return "No days selected";
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  if (sorted.length === 5 && weekdays.every((d) => sorted.includes(d))) return "Weekdays";
  if (sorted.length === 2 && weekend.every((d) => sorted.includes(d))) return "Weekends";
  return sorted.map((d) => DAYS[d].long.slice(0, 3)).join(", ");
}

export default function AlarmScreen() {
  const { profile, setAlarm } = useApp();
  const theme = getTheme(profile.theme);

  const [enabled, setEnabled] = useState<boolean>(profile.alarmEnabled);
  const [time, setTime] = useState<string>(profile.alarmTime);
  const [days, setDays] = useState<number[]>(profile.alarmDays);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);

  useEffect(() => {
    if (!profile.isPremium) {
      router.back();
    }
  }, [profile.isPremium]);

  const toggleDay = useCallback((idx: number) => {
    tapLight();
    setDays((prev) => {
      const has = prev.includes(idx);
      const next = has ? prev.filter((d) => d !== idx) : [...prev, idx];
      return next.sort((a, b) => a - b);
    });
    setDirty(true);
  }, []);

  const handleTimeChange = useCallback((_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setPickerVisible(false);
    if (!date) return;
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    setTime(`${hh}:${mm}`);
    setDirty(true);
  }, []);

  const handleEnable = useCallback((v: boolean) => {
    tapLight();
    setEnabled(v);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    tapMedium();
    if (enabled) {
      if (days.length === 0) {
        Alert.alert("Pick at least one day", "Select the days you want the alarm to fire.");
        return;
      }
      if (!isNotificationsSupported) {
        Alert.alert("Not supported", "Alarms work on iOS and Android.");
        return;
      }
      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert("Notifications off", "Enable notifications in Settings to use the alarm.");
        return;
      }
      const ok = await setAlarm(true, time, days);
      if (!ok) {
        Alert.alert("Couldn't schedule", "Please try again.");
        return;
      }
    } else {
      await setAlarm(false, time, days);
    }
    notifySuccess();
    setDirty(false);
    router.back();
  }, [enabled, days, time, setAlarm]);

  const presetWeekdays = useCallback(() => {
    tapLight();
    setDays([1, 2, 3, 4, 5]);
    setDirty(true);
  }, []);
  const presetEveryDay = useCallback(() => {
    tapLight();
    setDays([0, 1, 2, 3, 4, 5, 6]);
    setDirty(true);
  }, []);
  const presetWeekend = useCallback(() => {
    tapLight();
    setDays([0, 6]);
    setDirty(true);
  }, []);

  const timeDate = useMemo(() => {
    const [hStr, mStr] = time.split(":");
    const d = new Date();
    d.setHours(Number(hStr) || 7, Number(mStr) || 0, 0, 0);
    return d;
  }, [time]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => { tapLight(); router.back(); }} hitSlop={12} testID="alarm-back">
            <ChevronLeft size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.topTitle, { color: theme.text }]}>Wake-up Alarm</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={theme.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { shadowColor: theme.shadow }]}
          >
            <View style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.6)" }]}>
              <Sparkles size={18} color={theme.primary} />
              <Text style={[styles.heroBadgeText, { color: theme.primary }]}>PREMIUM</Text>
            </View>
            <Text style={[styles.heroTitle, { color: theme.primary }]}>{formatTime(time)}</Text>
            <Text style={[styles.heroSub, { color: theme.primary }]}>{describeDays(days)}</Text>
          </LinearGradient>

          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={[styles.row, { borderTopWidth: 0 }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                  <Zap size={16} color={theme.text} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Alarm</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>Nudges you to start your bed routine</Text>
                </View>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleEnable}
                trackColor={{ false: theme.progressBackground, true: theme.text }}
                thumbColor="#FFF"
                ios_backgroundColor={theme.progressBackground}
                testID="alarm-enable"
              />
            </View>

            <Pressable
              onPress={() => { tapLight(); setPickerVisible(true); }}
              style={[styles.row, { borderTopColor: theme.border, opacity: enabled ? 1 : 0.5 }]}
              disabled={!enabled}
              testID="alarm-time"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                  <Clock size={16} color={theme.text} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Time</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>{formatTime(time)}</Text>
                </View>
              </View>
              <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow, opacity: enabled ? 1 : 0.5 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Repeat</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d) => {
                const active = days.includes(d.idx);
                return (
                  <Pressable
                    key={d.idx}
                    onPress={() => toggleDay(d.idx)}
                    disabled={!enabled}
                    style={({ pressed }) => [
                      styles.dayChip,
                      {
                        backgroundColor: active ? theme.text : theme.surfaceAlt,
                        borderColor: active ? theme.text : theme.border,
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                      },
                    ]}
                    testID={`alarm-day-${d.idx}`}
                  >
                    <Text style={[styles.dayText, { color: active ? theme.background : theme.text }]}>
                      {d.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.presetRow}>
              <PresetChip label="Weekdays" onPress={presetWeekdays} theme={theme} disabled={!enabled} />
              <PresetChip label="Every day" onPress={presetEveryDay} theme={theme} disabled={!enabled} />
              <PresetChip label="Weekends" onPress={presetWeekend} theme={theme} disabled={!enabled} />
            </View>
          </View>

          <Text style={[styles.footnote, { color: theme.textSubtle }]}>
            Alarms use system notifications. Make sure BedVibe has notification permission and that your phone isn't on silent.
          </Text>
        </ScrollView>

        <View style={[styles.bottomBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <Pressable
            onPress={save}
            disabled={!dirty}
            style={({ pressed }) => [
              styles.saveCta,
              {
                backgroundColor: theme.primary,
                opacity: !dirty ? 0.4 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="alarm-save"
          >
            <Text style={[styles.saveText, { color: theme.background }]}>Save alarm</Text>
          </Pressable>
        </View>

        {pickerVisible && (Platform.OS === "ios" ? (
          <Modal transparent animationType="slide" visible onRequestClose={() => setPickerVisible(false)}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setPickerVisible(false)} />
            <View style={[styles.pickerSheet, { backgroundColor: theme.backgroundElevated }]}>
              <View style={styles.pickerHead}>
                <Text style={[styles.pickerTitle, { color: theme.text }]}>Wake-up time</Text>
                <Pressable onPress={() => setPickerVisible(false)}>
                  <Text style={[styles.pickerDone, { color: theme.accent }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={timeDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                themeVariant={theme.isDark ? "dark" : "light"}
                textColor={theme.text}
              />
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={timeDate}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        ))}
      </SafeAreaView>
    </View>
  );
}

function PresetChip({ label, onPress, theme, disabled }: { label: string; onPress: () => void; theme: ReturnType<typeof getTheme>; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.preset,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text style={[styles.presetText, { color: theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  hero: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  heroBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  heroTitle: { fontSize: 56, fontWeight: "800", letterSpacing: -2 },
  heroSub: { fontSize: 14, fontWeight: "600", marginTop: 4, opacity: 0.8 },
  section: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 6,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", letterSpacing: -0.2, marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowChev: { fontSize: 22, fontWeight: "300" },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 13, fontWeight: "800" },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md, flexWrap: "wrap" },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  presetText: { fontSize: 12, fontWeight: "700" },
  footnote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveCta: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  saveText: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  pickerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  pickerSheet: {
    paddingBottom: 30,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pickerTitle: { fontSize: 16, fontWeight: "800" },
  pickerDone: { fontSize: 16, fontWeight: "700" },
});
