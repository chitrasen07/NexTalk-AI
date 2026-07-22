"use client";

import * as React from "react";
import { onSnapshot } from "firebase/firestore";
import { subscribeToConversations } from "@/lib/chat/conversations";
import {
  subscribeToMembers,
  subscribeToMyMembership,
} from "@/lib/chat/conversations";
import { conversationDoc } from "@/lib/firebase/firestore";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { useProfilesStore } from "@/store/profiles-store";
import type { Conversation, ConversationMember } from "@/types";

interface UseConversationsResult {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}

/** Subscribe to the current user's conversations and warm the profile cache. */
export function useConversations(
  userId: string | null,
): UseConversationsResult {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  React.useEffect(() => {
    if (!userId || !isFirebaseConfigured) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToConversations(
      userId,
      (next) => {
        setConversations(next);
        setLoading(false);
        setError(null);
        const memberIds = next.flatMap((c) => c.memberIds);
        void ensureProfiles(memberIds);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [userId, ensureProfiles]);

  return { conversations, loading, error };
}

interface UseConversationResult {
  conversation: Conversation | null;
  loading: boolean;
  notFound: boolean;
}

/** Subscribe to a single conversation document. */
export function useConversation(
  conversationId: string | null,
): UseConversationResult {
  const [conversation, setConversation] = React.useState<Conversation | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  React.useEffect(() => {
    if (!conversationId || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    const unsub = onSnapshot(
      conversationDoc(conversationId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setConversation(data);
          void ensureProfiles(data.memberIds);
          setNotFound(false);
        } else {
          setConversation(null);
          setNotFound(true);
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [conversationId, ensureProfiles]);

  return { conversation, loading, notFound };
}

/** Subscribe to member docs for a single conversation. */
export function useConversationMembers(
  conversationId: string | null,
): ConversationMember[] {
  const [members, setMembers] = React.useState<ConversationMember[]>([]);

  React.useEffect(() => {
    if (!conversationId || !isFirebaseConfigured) {
      setMembers([]);
      return;
    }
    const unsub = subscribeToMembers(conversationId, setMembers);
    return () => unsub();
  }, [conversationId]);

  return members;
}

/** Subscribe to the current user's own membership document. */
export function useMyMembership(
  conversationId: string | null,
  userId: string | null,
): ConversationMember | null {
  const [member, setMember] = React.useState<ConversationMember | null>(null);

  React.useEffect(() => {
    if (!conversationId || !userId || !isFirebaseConfigured) {
      setMember(null);
      return;
    }
    const unsub = subscribeToMyMembership(conversationId, userId, setMember);
    return () => unsub();
  }, [conversationId, userId]);

  return member;
}
