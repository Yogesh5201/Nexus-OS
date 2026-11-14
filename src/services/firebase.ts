/**
 * Lazy, optional Firebase integration.
 *
 * NEXUS is local-first: it works fully offline with zero configuration.
 * If Firebase env vars are present, calling `getFirebase()` initializes the
 * SDK on demand (Auth + Firestore + Storage) for cloud sync / authentication.
 * Components should treat a `null` return as "cloud features disabled".
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when enough Firebase config is present to initialize. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId);

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let cached: FirebaseServices | null = null;

/** Get (and lazily initialize) Firebase services, or null if not configured. */
export function getFirebase(): FirebaseServices | null {
  if (!isFirebaseConfigured) return null;
  if (cached) return cached;

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return cached;
}
