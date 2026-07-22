"use client";

import * as React from "react";
import { subscribeToPresence } from "@/lib/firebase/database";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import type { PresenceState } from "@/types";

/** Subscribe to a single user's presence state. */
export function usePresence(userId: string | null | undefined): PresenceState | null {
  const [presence, setPresence] = React.useState<PresenceState | null>(null);

  React.useEffect(() => {
    if (!userId || !isFirebaseConfigured) {
      setPresence(null);
      return;
    }
    const unsub = subscribeToPresence(userId, setPresence);
    return () => unsub();
  }, [userId]);

  return presence;
}
