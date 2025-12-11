import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";

type FirebaseUser = {
  uid: string;
  email?: string | null;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    let unsubscribe: any;

    (async () => {
      // --------------------------------------------
      // LAZY LOAD FIREBASE CONFIG (SAFE)
      // --------------------------------------------
      const { getAuthInstance, db } = await import("../firebase/firebaseConfig");

      const auth = getAuthInstance();

      unsubscribe = auth.onAuthStateChanged(
        async (user: FirebaseUser | null) => {
          if (user) {
            setIsAuthenticated(true);

            try {
              const userRef = doc(db, "users", user.uid);
              const userDoc = await getDoc(userRef);

              setProfileCompleted(
                userDoc.exists() && !!userDoc.data()?.username
              );
            } catch (err) {
              console.warn("[Auth] Failed to load user profile", err);
              setProfileCompleted(false);
            }
          } else {
            setIsAuthenticated(false);
            setProfileCompleted(false);
          }

          setLoading(false);
        }
      );
    })();

    return () => unsubscribe && unsubscribe();
  }, []);

  // --------------------------------------------------
  // LOADING INITIAL SCREEN
  // --------------------------------------------------
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <StatusBar style="auto" />
      </View>
    );
  }

  // --------------------------------------------------
  // NAVIGATION FLOW
  // --------------------------------------------------
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated && profileCompleted && (
          <Stack.Screen name="(tabs)" />
        )}

        {isAuthenticated && !profileCompleted && (
          <Stack.Screen name="(auth)/profileSetup" />
        )}

        {!isAuthenticated && <Stack.Screen name="(auth)" />}

        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
