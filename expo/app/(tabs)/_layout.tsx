import { Tabs } from "expo-router";
import { Home, Trophy, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useApp } from "@/providers/AppProvider";
import { getTheme } from "@/constants/colors";

function TabBarBackground({ color }: { color: string }) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={70} tint="default" style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />;
}

export default function TabLayout() {
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 76,
          paddingTop: 12,
        },
        tabBarBackground: () => <TabBarBackground color={theme.tabBar} />,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <Home size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <Trophy size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <User size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
