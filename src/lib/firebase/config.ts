import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
} as const;

/**
 * True only when the required public Firebase env vars are actually present.
 * The UI uses this to disable Firebase-dependent actions and show setup hints.
 */
export const isFirebaseConfigured: boolean = Boolean(
  rawConfig.apiKey &&
    rawConfig.authDomain &&
    rawConfig.projectId &&
    rawConfig.appId,
);

/**
 * When env vars are missing (e.g. during CI builds without secrets) we fall
 * back to non-empty placeholders so `getAuth()`/`initializeApp()` don't throw
 * `auth/invalid-api-key` at module load. Real credentials are still required
 * for any network operation to succeed at runtime.
 */
const firebaseConfig = {
  apiKey: rawConfig.apiKey || "demo-api-key",
  authDomain: rawConfig.authDomain || "demo.firebaseapp.com",
  projectId: rawConfig.projectId || "demo-project",
  storageBucket: rawConfig.storageBucket || "demo-project.appspot.com",
  messagingSenderId: rawConfig.messagingSenderId || "0000000000",
  appId: rawConfig.appId || "1:0000000000:web:demo",
  databaseURL:
    rawConfig.databaseURL || "https://demo-project-default-rtdb.firebaseio.com",
} as const;

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const rtdb: Database = getDatabase(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export { firebaseConfig };
