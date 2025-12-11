// firebase/firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase App only once
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// -----------------------------
// Safe React Native Auth
// -----------------------------
let authInstance: ReturnType<typeof initializeAuth> | null = null;

export const getAuthInstance = (): ReturnType<typeof initializeAuth> => {
  if (authInstance) return authInstance;

  // Only initialize once
  if (!app) throw new Error("Firebase App is not initialized");

  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  return authInstance;
};

// -----------------------------
export const db = getFirestore(app);
export const storage = getStorage(app);
