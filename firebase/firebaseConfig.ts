// firebase/firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAap9MZDpdpsixSY1dD5m4x_XXj1poM6d0",
  authDomain: "vad-app-4a6e8.firebaseapp.com",
  projectId: "vad-app-4a6e8",
  storageBucket: "vad-app-4a6e8.firebasestorage.app",
  messagingSenderId: "98354868664",
  appId: "1:98354868664:web:441334cb2f14a3712f9f4d"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export single instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

