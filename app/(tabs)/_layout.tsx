// app/(tabs)/_layout.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

let BlurView: any = null;

if (Platform.OS === "ios") {
  try {
    BlurView = require("expo-blur").BlurView;
  } catch {
    BlurView = View;
  }
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "dark"].tint;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: "#6B7280",

        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={70} tint="dark" style={{ flex: 1 }} />
          ) : (
            <View style={{ flex: 1, backgroundColor: "#050814" }} />
          ),

        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          height: 72,
          paddingBottom: 12,
          paddingTop: 10,
          backgroundColor: "transparent",
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 4,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home-variant" : "home-variant-outline"}
              size={focused ? 28 : 25}
              color={color}
            />
          ),
        }}
      />

      {/* WALLET */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={focused ? 28 : 25}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={focused ? 28 : 25}
              color={color}
            />
          ),
        }}
      />

      {/* HIDDEN ROUTES (still navigable, not shown in tab bar) */}
      <Tabs.Screen name="data" options={{ href: null }} />
      <Tabs.Screen name="airtime" options={{ href: null }} />
      <Tabs.Screen name="electricity" options={{ href: null }} />
      <Tabs.Screen name="betting" options={{ href: null }} />
    </Tabs>
  );
}

