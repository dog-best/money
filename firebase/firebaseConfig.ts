import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
} from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// ------------ FIX: Safe lazy initialization -------------
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

// TS needs these declared here so other files can import them normally:
export let auth: Auth;
export let db: Firestore;
export let storage: FirebaseStorage;
export let app: FirebaseApp;

// Lazy getters that assign values only when first accessed
Object.defineProperties(exports, {
  app: {
    enumerable: true,
    get() {
      if (!_app) ensureApp();
      return _app!;
    },
  },
  auth: {
    enumerable: true,
    get() {
      if (!_auth) _auth = getAuth(ensureApp());
      return _auth!;
    },
  },
  db: {
    enumerable: true,
    get() {
      if (!_db) _db = getFirestore(ensureApp());
      return _db!;
    },
  },
  storage: {
    enumerable: true,
    get() {
      if (!_storage) _storage = getStorage(ensureApp());
      return _storage!;
    },
  },
});
