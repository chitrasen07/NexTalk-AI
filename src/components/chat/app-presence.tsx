"use client";

import * as React from "react";
import { initPresence } from "@/lib/firebase/database";
import {
  onForegroundMessage,
  requestNotificationPermission,
} from "@/lib/firebase/messaging";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

/**
 * Mounts once inside the authenticated area: wires up Realtime Database
 * presence and (best-effort) foreground push notifications.
 */
export function AppPresence() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    const cleanup = initPresence(user.uid);
    return () => cleanup();
  }, [user]);

  React.useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    let unsub: (() => void) | undefined;
    void requestNotificationPermission(user.uid).catch(() => undefined);
    void onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? "New message";
      const body = payload.notification?.body ?? "";
      toast(title, { description: body });
    }).then((fn) => {
      unsub = fn;
    });
    return () => unsub?.();
  }, [user]);

  return null;
}
