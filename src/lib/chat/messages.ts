import {
  doc,
  getCountFromServer,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  conversationDoc,
  messageDoc,
  messagesCol,
  reactionDoc,
  reactionsCol,
  receiptDoc,
  receiptsCol,
} from "@/lib/firebase/firestore";
import type {
  Message,
  MessageAttachment,
  MessageReaction,
  MessageReceipt,
  MessageType,
} from "@/types";

export const MESSAGE_PAGE_SIZE = 30;

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  text: string;
  type?: MessageType;
  attachment?: MessageAttachment | null;
  replyToId?: string | null;
  clientMessageId: string;
}

/**
 * Create a message and update the conversation's lastMessage preview atomically
 * with a batch write. Returns the new message id.
 */
export async function sendMessage(input: SendMessageInput): Promise<string> {
  const messageRef = doc(messagesCol(input.conversationId));
  const batch = writeBatch(db);
  const type = input.type ?? "text";
  const preview =
    type === "text"
      ? input.text
      : type === "image"
        ? "Photo"
        : type === "video"
          ? "Video"
          : type === "audio"
            ? "Voice message"
            : "File";

  batch.set(messageRef, {
    id: messageRef.id,
    clientMessageId: input.clientMessageId,
    senderId: input.senderId,
    text: input.text,
    type,
    attachment: input.attachment ?? null,
    replyToId: input.replyToId ?? null,
    editedAt: null,
    deletedAt: null,
    createdAt: serverTimestamp() as never,
  });

  batch.update(conversationDoc(input.conversationId), {
    lastMessage: {
      text: preview,
      senderId: input.senderId,
      createdAt: serverTimestamp() as never,
    },
    updatedAt: serverTimestamp() as never,
  });

  await batch.commit();
  return messageRef.id;
}

/** Real-time listener for the most recent page of messages, oldest-first. */
export function subscribeToMessages(
  conversationId: string,
  pageSize: number,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    messagesCol(conversationId),
    orderBy("createdAt", "desc"),
    fbLimit(pageSize),
  );
  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => d.data()).reverse();
      callback(messages);
    },
    (error) => onError?.(error),
  );
}

export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Fetch older messages that were created before `beforeCreatedAt` (for infinite
 * scroll). Uses the oldest loaded message's timestamp as the cursor so it works
 * alongside the realtime listener (which owns the newest page).
 */
export async function fetchOlderMessages(
  conversationId: string,
  beforeCreatedAt: Timestamp | null,
  pageSize = MESSAGE_PAGE_SIZE,
): Promise<MessagePage> {
  const q = beforeCreatedAt
    ? query(
        messagesCol(conversationId),
        orderBy("createdAt", "desc"),
        startAfter(beforeCreatedAt),
        fbLimit(pageSize),
      )
    : query(
        messagesCol(conversationId),
        orderBy("createdAt", "desc"),
        fbLimit(pageSize),
      );
  const snap = await getDocs(q);
  const messages = snap.docs.map((d) => d.data()).reverse();
  return {
    messages,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Count messages created after the user's last-read timestamp (unread count).
 * Uses an aggregate count query so it stays cheap even for busy chats.
 */
export async function getUnreadCount(
  conversationId: string,
  since: Timestamp | null,
): Promise<number> {
  if (!since) {
    const snap = await getCountFromServer(
      query(messagesCol(conversationId), orderBy("createdAt")),
    );
    return snap.data().count;
  }
  const snap = await getCountFromServer(
    query(
      messagesCol(conversationId),
      where("createdAt", ">", since),
      orderBy("createdAt"),
    ),
  );
  return snap.data().count;
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  text: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(messageDoc(conversationId, messageId), {
    text,
    editedAt: serverTimestamp() as never,
  });
  await batch.commit();
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(messageDoc(conversationId, messageId), {
    text: "",
    attachment: null,
    deletedAt: serverTimestamp() as never,
  });
  await batch.commit();
}

/* --------------------------------- Receipts -------------------------------- */

export async function markDelivered(
  conversationId: string,
  messageId: string,
  userId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(
    receiptDoc(conversationId, messageId, userId),
    { userId, deliveredAt: serverTimestamp() as never, seenAt: null },
    { merge: true },
  );
  await batch.commit();
}

export async function markSeen(
  conversationId: string,
  messageIds: string[],
  userId: string,
): Promise<void> {
  if (messageIds.length === 0) return;
  // Batch limit is 500; chunk defensively.
  for (let i = 0; i < messageIds.length; i += 400) {
    const chunk = messageIds.slice(i, i + 400);
    const batch = writeBatch(db);
    for (const messageId of chunk) {
      batch.set(
        receiptDoc(conversationId, messageId, userId),
        {
          userId,
          deliveredAt: serverTimestamp() as never,
          seenAt: serverTimestamp() as never,
        },
        { merge: true },
      );
    }
    await batch.commit();
  }
}

export function subscribeToReceipts(
  conversationId: string,
  messageId: string,
  callback: (receipts: MessageReceipt[]) => void,
): Unsubscribe {
  return onSnapshot(receiptsCol(conversationId, messageId), (snap) =>
    callback(snap.docs.map((d) => d.data())),
  );
}

/* --------------------------------- Reactions ------------------------------- */

export async function toggleReaction(
  conversationId: string,
  messageId: string,
  userId: string,
  emoji: string,
  existing: MessageReaction | null,
): Promise<void> {
  const batch = writeBatch(db);
  const ref = reactionDoc(conversationId, messageId, userId);
  if (existing && existing.emoji === emoji) {
    batch.delete(ref);
  } else {
    batch.set(ref, {
      userId,
      emoji,
      createdAt: serverTimestamp() as never,
    });
  }
  await batch.commit();
}

export function subscribeToReactions(
  conversationId: string,
  messageId: string,
  callback: (reactions: MessageReaction[]) => void,
): Unsubscribe {
  return onSnapshot(reactionsCol(conversationId, messageId), (snap) =>
    callback(snap.docs.map((d) => d.data())),
  );
}
