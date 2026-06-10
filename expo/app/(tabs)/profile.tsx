import React, { useCallback, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Bell, Check, CloudOff, Clock, Crown, Edit3, FileText, Heart, Info, Lock, LogOut, Mail, Palette, Shield, Sparkles, Trash2, Wifi, Zap } from "lucide-react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getTheme, radius, spacing, themeMeta, themeOrder, ThemeName } from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensurePermission, isNotificationsSupported } from "@/lib/notifications";
import { tapLight, tapMedium } from "@/lib/haptics";

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function ProfileScreen() {
  const { profile, updateProfile, showPaywall, setReminder } = useApp();
  const { email, signOut, isConfigured, deleteAccount } = useAuth();
  const theme = getTheme(profile.theme);

  const handleSignOut = useCallback(() => {
    tapLight();
    Alert.alert("Sign out?", "You'll need to sign in again to sync your streak.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    tapLight();
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, streak, photos history, and removes you from the leaderboard. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Last chance. Your data will be permanently erased.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete forever",
                  style: "destructive",
                  onPress: async () => {
                    const res = await deleteAccount();
                    if (!res.ok) {
                      Alert.alert("Couldn't delete", res.error ?? "Please try again.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteAccount]);

  const [nameEditing, setNameEditing] = useState<boolean>(false);
  const [draftName, setDraftName] = useState<string>(profile.name);
  const [timePickerVisible, setTimePickerVisible] = useState<boolean>(false);
  const [permPrimerVisible, setPermPrimerVisible] = useState<boolean>(false);
  const [aboutVisible, setAboutVisible] = useState<boolean>(false);

  const handleThemeChange = useCallback(
    (key: ThemeName) => {
      tapLight();
      updateProfile({ theme: key });
    },
    [updateProfile]
  );

  const handleReminderToggle = useCallback(
    async (next: boolean) => {
      tapLight();
      if (!isNotificationsSupported) {
        Alert.alert("Reminders", "Daily reminders are available on iOS and Android.");
        return;
      }
      if (next) {
        const granted = await ensurePermission();
        if (!granted) {
          setPermPrimerVisible(true);
          return;
        }
        const ok = await setReminder(true);
        if (!ok) Alert.alert("Couldn't schedule", "Please try again.");
      } else {
        await setReminder(false);
      }
    },
    [setReminder]
  );

  const handleAlarmTap = useCallback(() => {
    tapLight();
    router.push("/alarm");
  }, []);

  const handleTimeChange = useCallback(
    async (_e: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS !== "ios") setTimePickerVisible(false);
      if (!date) return;
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const value = `${hh}:${mm}`;
      if (profile.reminderEnabled) {
        await setReminder(true, value);
      } else {
        await updateProfile({ reminderTime: value });
      }
    },
    [profile.reminderEnabled, setReminder, updateProfile]
  );

  const saveName = useCallback(async () => {
    const trimmed = draftName.trim();
    if (trimmed.length === 0) {
      setDraftName(profile.name);
      setNameEditing(false);
      return;
    }
    await updateProfile({ name: trimmed });
    setNameEditing(false);
  }, [draftName, profile.name, updateProfile]);

  const [hStr, mStr] = profile.reminderTime.split(":");
  const reminderDate = (() => {
    const d = new Date();
    d.setHours(Number(hStr) || 8, Number(mStr) || 0, 0, 0);
    return d;
  })();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.textSubtle }]}>YOUR PROFILE</Text>
        <Text style={[styles.header, { color: theme.text }]}>Profile</Text>

        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <LinearGradient
            colors={theme.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileBanner}
          />
          <View style={[styles.avatarLarge, { backgroundColor: theme.text, borderColor: theme.background }]}>
            <Text style={[styles.avatarLargeText, { color: theme.background }]}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileBody}>
            {nameEditing ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  onSubmitEditing={saveName}
                  onBlur={saveName}
                  style={[styles.nameInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSubtle}
                  autoFocus
                  maxLength={20}
                  testID="name-input"
                />
                <Pressable onPress={saveName} style={[styles.saveBtn, { backgroundColor: theme.text }]}>
                  <Check size={16} color={theme.background} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => { tapLight(); setDraftName(profile.name); setNameEditing(true); }} style={styles.nameRow}>
                <Text style={[styles.profileName, { color: theme.text }]}>{profile.name}</Text>
                <Edit3 size={14} color={theme.textSubtle} />
              </Pressable>
            )}
            <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
              <Crown size={12} color={theme.accent} fill={theme.accent} />
              <Text style={[styles.badgeText, { color: theme.accent }]}>Premium member</Text>
            </View>
            {email && (
              <Text style={[styles.email, { color: theme.textSubtle }]} numberOfLines={1}>{email}</Text>
            )}
            <View style={[styles.statusRow, { backgroundColor: theme.surfaceAlt }]}>
              {isConfigured ? (
                <>
                  <Wifi size={11} color={theme.success} />
                  <Text style={[styles.statusText, { color: theme.textMuted }]}>Cloud sync on</Text>
                </>
              ) : (
                <>
                  <CloudOff size={11} color={theme.textSubtle} />
                  <Text style={[styles.statusText, { color: theme.textMuted }]}>Offline mode</Text>
                </>
              )}
            </View>
          </View>
        </View>



        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={styles.sectionHead}>
            <Palette size={16} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
          </View>
          <View style={styles.themeGrid}>
            {themeOrder.map((key) => {
              const meta = themeMeta[key];
              const isActive = profile.theme === key;
              const locked = meta.isPremium && !profile.isPremium;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleThemeChange(key)}
                  style={({ pressed }) => [
                    styles.themeCard,
                    {
                      borderColor: isActive ? theme.text : theme.border,
                      backgroundColor: theme.surface,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                  testID={`theme-${key}`}
                >
                  <LinearGradient
                    colors={meta.preview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.themePreview}
                  >
                    {locked && (
                      <View style={styles.themeLockBadge}>
                        <Lock size={12} color="#FFF" />
                      </View>
                    )}
                    {isActive && (
                      <View style={[styles.themeActiveBadge, { backgroundColor: theme.text }]}>
                        <Check size={12} color={theme.background} />
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={[styles.themeLabel, { color: theme.text }]}>{meta.label}</Text>
                  <Text style={[styles.themeTagline, { color: theme.textMuted }]}>{meta.tagline}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={styles.sectionHead}>
            <Bell size={16} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminders</Text>
          </View>

          <View style={[styles.row, { borderTopColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Bell size={16} color={theme.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Daily reminder</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {isNotificationsSupported ? "A gentle nudge each morning" : "Available on iOS & Android"}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: theme.progressBackground, true: theme.text }}
              thumbColor="#FFF"
              ios_backgroundColor={theme.progressBackground}
              disabled={!isNotificationsSupported}
            />
          </View>

          <Pressable
            onPress={() => { tapLight(); setTimePickerVisible(true); }}
            style={[styles.row, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth, opacity: profile.reminderEnabled ? 1 : 0.5 }]}
            disabled={!profile.reminderEnabled}
            testID="reminder-time"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Clock size={16} color={theme.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Reminder time</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>{formatTime(profile.reminderTime)}</Text>
              </View>
            </View>
            <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
          </Pressable>

          <Pressable
            onPress={handleAlarmTap}
            style={[styles.row, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Zap size={16} color={profile.alarmEnabled ? theme.accent : theme.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Wake-up alarm</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {profile.alarmEnabled
                    ? `On · ${formatTime(profile.alarmTime)}`
                    : "Tap to set up your wake-up nudge"}
                </Text>
              </View>
            </View>
            <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Pressable
            onPress={() => { tapLight(); setAboutVisible(true); }}
            style={[styles.row, { borderTopWidth: 0, paddingTop: 6 }]}
            testID="about-bedvibe"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Info size={16} color={theme.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>About BedVibe</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Version, terms & privacy</Text>
              </View>
            </View>
            <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/privacy");
            }}
            style={[styles.row, { borderTopColor: theme.border }]}
            testID="open-privacy"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Shield size={16} color={theme.text} />
              </View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Privacy policy</Text>
            </View>
            <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => { tapLight(); router.push("/terms"); }}
            style={[styles.row, { borderTopColor: theme.border }]}
            testID="open-terms"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <FileText size={16} color={theme.text} />
              </View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Terms of service</Text>
            </View>
            <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tapLight();
              Linking.openURL("mailto:hello@bedvibe.app?subject=BedVibe%20feedback").catch(() => {});
            }}
            style={[styles.row, { borderTopColor: theme.border }]}
            testID="contact-support"
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Mail size={16} color={theme.text} />
              </View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Contact us</Text>
            </View>
            <Text style={[styles.rowChev, { color: theme.textSubtle }]}>›</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={[styles.signOut, { backgroundColor: theme.surface, borderColor: theme.border }]}
          testID="sign-out"
        >
          <LogOut size={16} color={theme.error} />
          <Text style={[styles.signOutText, { color: theme.error }]}>Sign out</Text>
        </Pressable>

        <Pressable
          onPress={handleDeleteAccount}
          style={styles.deleteRow}
          testID="delete-account"
        >
          <Trash2 size={13} color={theme.textSubtle} />
          <Text style={[styles.deleteText, { color: theme.textSubtle }]}>Delete my account</Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>

      {timePickerVisible && (Platform.OS === "ios" ? (
        <Modal transparent animationType="slide" visible onRequestClose={() => setTimePickerVisible(false)}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setTimePickerVisible(false)} />
          <View style={[styles.pickerSheet, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.pickerHead}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>Reminder time</Text>
              <Pressable onPress={() => setTimePickerVisible(false)}>
                <Text style={[styles.pickerDone, { color: theme.accent }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={reminderDate}
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
          value={reminderDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      ))}

      <Modal transparent animationType="fade" visible={aboutVisible} onRequestClose={() => setAboutVisible(false)}>
        <Pressable style={styles.primerBackdrop} onPress={() => setAboutVisible(false)}>
          <Pressable style={[styles.primerCard, { backgroundColor: theme.backgroundElevated }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.primerIcon, { backgroundColor: theme.accentSoft }]}>
              <Heart size={24} color={theme.accent} fill={theme.accent} />
            </View>
            <Text style={[styles.primerTitle, { color: theme.text }]}>BedVibe</Text>
            <Text style={[styles.primerBody, { color: theme.textMuted }]}>
              A daily ritual for the bed-makers of the world. Snap, score, smile. Made with care.
            </Text>
            <Text style={[styles.primerBody, { color: theme.textSubtle, marginBottom: 12 }]}>Version 1.0 · Build 1</Text>
            <Pressable
              onPress={() => {
                setAboutVisible(false);
                router.push("/terms");
              }}
              style={[styles.primerCta, { backgroundColor: theme.text }]}
            >
              <Text style={[styles.primerCtaText, { color: theme.background }]}>Read terms</Text>
            </Pressable>
            <Pressable onPress={() => setAboutVisible(false)} style={styles.primerSkip}>
              <Text style={[styles.primerSkipText, { color: theme.textMuted }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={permPrimerVisible} onRequestClose={() => setPermPrimerVisible(false)}>
        <View style={styles.primerBackdrop}>
          <View style={[styles.primerCard, { backgroundColor: theme.backgroundElevated }]}>
            <View style={[styles.primerIcon, { backgroundColor: theme.accentSoft }]}>
              <Bell size={24} color={theme.accent} />
            </View>
            <Text style={[styles.primerTitle, { color: theme.text }]}>Allow notifications?</Text>
            <Text style={[styles.primerBody, { color: theme.textMuted }]}>
              We'll send a single, gentle nudge each morning so you never miss your bed-making ritual.
            </Text>
            <Pressable
              onPress={async () => {
                setPermPrimerVisible(false);
                tapMedium();
                const granted = await ensurePermission();
                if (granted) {
                  await setReminder(true);
                } else {
                  Alert.alert("Notifications off", "You can enable them later in Settings.");
                }
              }}
              style={[styles.primerCta, { backgroundColor: theme.text }]}
            >
              <Text style={[styles.primerCtaText, { color: theme.background }]}>Continue</Text>
            </Pressable>
            <Pressable onPress={() => setPermPrimerVisible(false)} style={styles.primerSkip}>
              <Text style={[styles.primerSkipText, { color: theme.textMuted }]}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface PremiumRowProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  theme: ReturnType<typeof getTheme>;
  onPress: () => void;
  isPremium: boolean;
  border?: boolean;
}

function PremiumRow({ icon, title, sub, theme, onPress, isPremium, border }: PremiumRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { borderTopColor: theme.border, borderTopWidth: border ? StyleSheet.hairlineWidth : StyleSheet.hairlineWidth },
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.rowSub, { color: theme.textMuted }]}>{sub}</Text>
        </View>
      </View>
      {!isPremium && <Lock size={14} color={theme.textSubtle} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: spacing.md,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: spacing.lg,
  },
  profileCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  profileBanner: {
    height: 80,
  },
  avatarLarge: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
  avatarLargeText: {
    fontSize: 30,
    fontWeight: "800",
  },
  profileBody: {
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  nameEditRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  nameInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  email: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: spacing.lg,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "600",
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  upgradeBody: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  upgradeCta: {
    fontSize: 13,
    fontWeight: "800",
  },
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
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  themeCard: {
    width: "47%",
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: 8,
  },
  themePreview: {
    width: "100%",
    height: 70,
    borderRadius: radius.md,
    marginBottom: 8,
    overflow: "hidden",
  },
  themeLockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  themeActiveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  themeTagline: {
    fontSize: 11,
    marginTop: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rowChev: {
    fontSize: 22,
    fontWeight: "300",
  },
  devToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  devToggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
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
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: "700",
  },
  primerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  primerCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  primerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primerTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  primerBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  primerCta: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  primerCtaText: {
    fontSize: 15,
    fontWeight: "800",
  },
  primerSkip: {
    paddingVertical: 12,
  },
  primerSkipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
