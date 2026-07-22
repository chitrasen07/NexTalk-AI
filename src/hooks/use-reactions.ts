"use client";

import * as React from "react";
import { subscribeToReactions } from "@/lib/chat/messages";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import type { MessageReaction } from "@/types";

/** Subscribe to reactions for a single message. */
export function useReactions(
  conversationId: string | null,
  messageId: string,
  enabled: boolean,
): MessageReaction[] {
  const [reactions, setReactions] = React.useState<MessageReaction[]>([]);

  React.useEffect(() => {
    if (!conversationId || !enabled || !isFirebaseConfigured) {
      setReactions([]);
      return;
    }
    const unsub = subscribeToReactions(conversationId, messageId, setReactions);
    return () => unsub();
  }, [conversationId, messageId, enabled]);

  return reactions;
}
