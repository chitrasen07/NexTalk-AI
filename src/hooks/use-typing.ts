"use client";

import * as React from "react";
import { setTyping, subscribeToTyping } from "@/lib/firebase/database";
import { isFirebaseConfigured } from "@/lib/firebase/config";

const TYPING_TIMEOUT = 2000;

/**
 * Two-way typing hook: exposes the list of other users currently typing and a
 * debounced `notifyTyping` to broadcast the current user's typing state.
 */
export function useTyping(
  conversationId: string | null,
  currentUserId: string | null,
) {
  const [typingUserIds, setTypingUserIds] = React.useState<string[]>([]);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = React.useRef(false);

  React.useEffect(() => {
    if (!conversationId || !isFirebaseConfigured) {
      setTypingUserIds([]);
      return;
    }
    const unsub = subscribeToTyping(conversationId, (ids) => {
      setTypingUserIds(
        currentUserId ? ids.filter((id) => id !== currentUserId) : ids,
      );
    });
    return () => unsub();
  }, [conversationId, currentUserId]);

  const stopTyping = React.useCallback(() => {
    if (!conversationId || !currentUserId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      void setTyping(conversationId, currentUserId, false);
    }
  }, [conversationId, currentUserId]);

  const notifyTyping = React.useCallback(() => {
    if (!conversationId || !currentUserId || !isFirebaseConfigured) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      void setTyping(conversationId, currentUserId, true);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      void setTyping(conversationId, currentUserId, false);
    }, TYPING_TIMEOUT);
  }, [conversationId, currentUserId]);

  // Cleanup on unmount / conversation change.
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isTypingRef.current && conversationId && currentUserId) {
        void setTyping(conversationId, currentUserId, false);
      }
      isTypingRef.current = false;
    };
  }, [conversationId, currentUserId]);

  return { typingUserIds, notifyTyping, stopTyping };
}
