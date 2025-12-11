import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth/react-native";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --------------------------------------------
// FIREBASE CONFIG
// --------------------------------------------
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize only once
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --------------------------------------------
// AUTH (React Native SAFE)
// --------------------------------------------
let authInstance: ReturnType<typeof initializeAuth> | null = null;

export const getAuthInstance = () => {
  if (authInstance) return authInstance;

  try {
    // MUST be used in React Native (no browser persistence)
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // DO NOT CALL getAuth() HERE — it breaks in React Native
    console.warn("[Firebase] initializeAuth already exists");
    authInstance = getAuth(app);
  }

  return authInstance;
};

// --------------------------------------------
export const db = getFirestore(app);
export const storage = getStorage(app);
