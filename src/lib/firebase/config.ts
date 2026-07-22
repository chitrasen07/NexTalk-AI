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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

/** True when the required public Firebase env vars are present. */
export const isFirebaseConfigured: boolean = Boolean(
  rawConfig.apiKey &&
    rawConfig.authDomain &&
    rawConfig.projectId &&
    rawConfig.appId,
);

/**
 * Fall back to placeholders only when env vars are missing (e.g. CI builds),
 * so `initializeApp` / `getAuth` do not throw at module load.
 */
const firebaseConfig = {
  apiKey: rawConfig.apiKey || "demo-api-key",
  authDomain: rawConfig.authDomain || "demo.firebaseapp.com",
  projectId: rawConfig.projectId || "demo-project",
  storageBucket: rawConfig.storageBucket || "demo-project.appspot.com",
  messagingSenderId: rawConfig.messagingSenderId || "0000000000",
  appId: rawConfig.appId || "1:0000000000:web:demo",
  measurementId: rawConfig.measurementId || undefined,
  databaseURL:
    rawConfig.databaseURL || "https://demo-project-default-rtdb.firebaseio.com",
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const rtdb: Database = getDatabase(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export { firebaseConfig };
