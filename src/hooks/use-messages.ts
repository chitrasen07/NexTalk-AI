"use client";

import * as React from "react";
import {
  MESSAGE_PAGE_SIZE,
  fetchOlderMessages,
  sendMessage,
  subscribeToMessages,
  type SendMessageInput,
} from "@/lib/chat/messages";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useProfilesStore } from "@/store/profiles-store";
import type { ClientMessage, Message, MessageStatus } from "@/types";

function makeClientId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface OptimisticMessage extends ClientMessage {
  localCreatedAt: number;
}

interface UseMessagesResult {
  messages: ClientMessage[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
  send: (input: {
    text: string;
    type?: Message["type"];
    attachment?: Message["attachment"];
    replyToId?: string | null;
  }) => Promise<void>;
  retry: (clientMessageId: string) => Promise<void>;
}

/**
 * Real-time messages with optimistic sending, duplicate prevention (via
 * clientMessageId), cursor pagination and retry support.
 */
export function useMessages(
  conversationId: string | null,
  currentUserId: string | null,
): UseMessagesResult {
  const [serverMessages, setServerMessages] = React.useState<Message[]>([]);
  const [olderMessages, setOlderMessages] = React.useState<Message[]>([]);
  const [optimistic, setOptimistic] = React.useState<OptimisticMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  // Reset when conversation changes.
  React.useEffect(() => {
    setServerMessages([]);
    setOlderMessages([]);
    setOptimistic([]);
    setLoading(true);
    setHasMore(true);
  }, [conversationId]);

  // Realtime listener for the newest page.
  React.useEffect(() => {
    if (!conversationId || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToMessages(
      conversationId,
      MESSAGE_PAGE_SIZE,
      (msgs) => {
        setServerMessages(msgs);
        setLoading(false);
        void ensureProfiles(msgs.map((m) => m.senderId));
      },
    );
    return () => unsub();
  }, [conversationId, ensureProfiles]);

  const loadMore = React.useCallback(async () => {
    if (!conversationId || loadingMore || !hasMore) return;
    // The oldest known message is the pagination anchor.
    const combined = [...olderMessages, ...serverMessages];
    const oldest = combined[0];
    if (!oldest || !oldest.createdAt) return;
    setLoadingMore(true);
    try {
      const page = await fetchOlderMessages(
        conversationId,
        oldest.createdAt,
        MESSAGE_PAGE_SIZE,
      );
      const known = new Set(combined.map((m) => m.id));
      const fresh = page.messages.filter((m) => !known.has(m.id));
      setHasMore(page.hasMore);
      setOlderMessages((prev) => [...fresh, ...prev]);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loadingMore, olderMessages, serverMessages]);

  const doSend = React.useCallback(
    async (input: SendMessageInput) => {
      try {
        await sendMessage(input);
        // Success: the realtime listener will surface the server copy; drop the
        // optimistic entry once we detect the matching clientMessageId.
      } catch {
        setOptimistic((prev) =>
          prev.map((m) =>
            m.clientMessageId === input.clientMessageId
              ? { ...m, status: "failed" as MessageStatus }
              : m,
          ),
        );
      }
    },
    [],
  );

  const send = React.useCallback<UseMessagesResult["send"]>(
    async (input) => {
      if (!conversationId || !currentUserId) return;
      const clientMessageId = makeClientId();
      const localCreatedAt = Date.now();
      const optimisticMsg: OptimisticMessage = {
        id: clientMessageId,
        clientMessageId,
        senderId: currentUserId,
        text: input.text,
        type: input.type ?? "text",
        attachment: input.attachment ?? null,
        replyToId: input.replyToId ?? null,
        editedAt: null,
        deletedAt: null,
        createdAt: null,
        status: "pending",
        localCreatedAt,
      };
      setOptimistic((prev) => [...prev, optimisticMsg]);
      await doSend({
        conversationId,
        senderId: currentUserId,
        text: input.text,
        type: input.type,
        attachment: input.attachment ?? null,
        replyToId: input.replyToId ?? null,
        clientMessageId,
      });
    },
    [conversationId, currentUserId, doSend],
  );

  const retry = React.useCallback<UseMessagesResult["retry"]>(
    async (clientMessageId) => {
      if (!conversationId || !currentUserId) return;
      const target = optimistic.find(
        (m) => m.clientMessageId === clientMessageId,
      );
      if (!target) return;
      setOptimistic((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, status: "pending" as MessageStatus }
            : m,
        ),
      );
      await doSend({
        conversationId,
        senderId: currentUserId,
        text: target.text,
        type: target.type,
        attachment: target.attachment,
        replyToId: target.replyToId,
        clientMessageId,
      });
    },
    [conversationId, currentUserId, doSend, optimistic],
  );

  // Drop optimistic messages once their server copy arrives.
  React.useEffect(() => {
    if (optimistic.length === 0) return;
    const serverClientIds = new Set(
      serverMessages.map((m) => m.clientMessageId),
    );
    setOptimistic((prev) =>
      prev.filter((m) => !serverClientIds.has(m.clientMessageId)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMessages]);

  const messages = React.useMemo<ClientMessage[]>(() => {
    const serverCombined = [...olderMessages, ...serverMessages];
    const seen = new Set<string>();
    const deduped: ClientMessage[] = [];
    for (const m of serverCombined) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      deduped.push({ ...m, status: "sent" });
    }
    const pending = optimistic
      .filter((m) => !seen.has(m.id))
      .sort((a, b) => a.localCreatedAt - b.localCreatedAt);
    return [...deduped, ...pending];
  }, [olderMessages, serverMessages, optimistic]);

  return {
    messages,
    loading,
    hasMore,
    loadingMore,
    loadMore,
    send,
    retry,
  };
}
