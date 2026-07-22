import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp, db, firebaseConfig } from "./config";

let messagingInstance: Messaging | null = null;

async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  messagingInstance = getMessaging(firebaseApp);
  return messagingInstance;
}

/**
 * Request notification permission, register the service worker, retrieve an FCM
 * token and persist it under the user's fcmTokens map in Firestore.
 */
export async function requestNotificationPermission(
  userId: string,
): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const swParams = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${swParams.toString()}`,
  );

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await setDoc(
      doc(db, "users", userId, "fcmTokens", token),
      { token, createdAt: serverTimestamp(), userAgent: navigator.userAgent },
      { merge: true },
    );
  }
  return token || null;
}

/** Foreground message listener. Returns an unsubscribe function. */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => undefined;
  return onMessage(messaging, callback);
}
