import {
  onValue,
  onDisconnect,
  ref,
  serverTimestamp,
  set,
  remove,
  type Unsubscribe,
} from "firebase/database";
import { rtdb } from "./config";
import type { PresenceState, TypingState } from "@/types";

/* -------------------------------------------------------------------------- */
/*                                  Presence                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wire up presence for the given user. Uses `.info/connected` and
 * `onDisconnect()` so the user is marked offline even on a hard crash.
 * Returns a cleanup function that stops the listener and marks offline.
 */
export function initPresence(userId: string): () => void {
  const statusRef = ref(rtdb, `status/${userId}`);
  const connectedRef = ref(rtdb, ".info/connected");

  const online: PresenceState = {
    state: "online",
    lastChanged: serverTimestamp() as unknown as number,
  };
  const offline: PresenceState = {
    state: "offline",
    lastChanged: serverTimestamp() as unknown as number,
  };

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;
    onDisconnect(statusRef)
      .set(offline)
      .then(() => {
        void set(statusRef, online);
      })
      .catch(() => {
        /* onDisconnect can fail offline; presence retries on reconnect. */
      });
  });

  return () => {
    unsubscribe();
    void set(statusRef, offline);
  };
}

export function subscribeToPresence(
  userId: string,
  callback: (presence: PresenceState | null) => void,
): Unsubscribe {
  const statusRef = ref(rtdb, `status/${userId}`);
  return onValue(statusRef, (snap) => {
    callback((snap.val() as PresenceState | null) ?? null);
  });
}

/* -------------------------------------------------------------------------- */
/*                              Typing indicators                             */
/* -------------------------------------------------------------------------- */

export async function setTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean,
): Promise<void> {
  const typingRef = ref(rtdb, `typing/${conversationId}/${userId}`);
  if (!isTyping) {
    await remove(typingRef);
    return;
  }
  const payload: TypingState = {
    isTyping: true,
    updatedAt: serverTimestamp() as unknown as number,
  };
  await set(typingRef, payload);
  // Automatically clear typing if the connection drops mid-typing.
  void onDisconnect(typingRef).remove();
}

/** Subscribe to typing state for everyone in a conversation. */
export function subscribeToTyping(
  conversationId: string,
  callback: (typingUserIds: string[]) => void,
): Unsubscribe {
  const typingRef = ref(rtdb, `typing/${conversationId}`);
  return onValue(typingRef, (snap) => {
    const value = (snap.val() as Record<string, TypingState> | null) ?? {};
    const now = Date.now();
    const active = Object.entries(value)
      .filter(([, state]) => {
        if (!state?.isTyping) return false;
        // Treat entries older than 6s as stale.
        const ts = typeof state.updatedAt === "number" ? state.updatedAt : now;
        return now - ts < 6000;
      })
      .map(([uid]) => uid);
    callback(active);
  });
}
