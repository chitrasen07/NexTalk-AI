import {
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  conversationDoc,
  conversationsCol,
  memberDoc,
  membersCol,
} from "@/lib/firebase/firestore";
import type { Conversation, ConversationMember } from "@/types";
import { doc } from "firebase/firestore";

/** Subscribe to all conversations the user is a member of, newest first. */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    conversationsCol(),
    where("memberIds", "array-contains", userId),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data())),
    (error) => onError?.(error),
  );
}

export function subscribeToMembers(
  conversationId: string,
  callback: (members: ConversationMember[]) => void,
): Unsubscribe {
  return onSnapshot(membersCol(conversationId), (snap) =>
    callback(snap.docs.map((d) => d.data())),
  );
}

export function subscribeToMyMembership(
  conversationId: string,
  userId: string,
  callback: (member: ConversationMember | null) => void,
): Unsubscribe {
  return onSnapshot(memberDoc(conversationId, userId), (snap) =>
    callback(snap.exists() ? snap.data() : null),
  );
}

/** Find an existing direct conversation between two users, if any. */
export async function findDirectConversation(
  userA: string,
  userB: string,
): Promise<Conversation | null> {
  const q = query(
    conversationsCol(),
    where("type", "==", "direct"),
    where("memberIds", "array-contains", userA),
  );
  const snap = await getDocs(q);
  const match = snap.docs
    .map((d) => d.data())
    .find((c) => c.memberIds.includes(userB) && c.memberIds.length === 2);
  return match ?? null;
}

/** Create (or return an existing) direct conversation between two users. */
export async function createDirectConversation(
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  const existing = await findDirectConversation(currentUserId, otherUserId);
  if (existing) return existing.id;

  const conversationRef = doc(conversationsCol());
  const batch = writeBatch(db);

  batch.set(conversationRef, {
    id: conversationRef.id,
    type: "direct",
    name: null,
    avatarURL: null,
    memberIds: [currentUserId, otherUserId],
    createdBy: currentUserId,
    lastMessage: null,
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
  });

  for (const [index, uid] of [currentUserId, otherUserId].entries()) {
    batch.set(memberDoc(conversationRef.id, uid), {
      userId: uid,
      role: index === 0 ? "owner" : "member",
      joinedAt: serverTimestamp() as never,
      lastReadMessageId: null,
      lastReadAt: null,
      lastDeliveredAt: null,
      archived: false,
      muted: false,
      pinned: false,
    });
  }

  await batch.commit();
  return conversationRef.id;
}

/** Create a group conversation with the given members. */
export async function createGroupConversation(
  currentUserId: string,
  memberIds: string[],
  name: string,
  avatarURL: string | null,
): Promise<string> {
  const allMembers = Array.from(new Set([currentUserId, ...memberIds]));
  const conversationRef = doc(conversationsCol());
  const batch = writeBatch(db);

  batch.set(conversationRef, {
    id: conversationRef.id,
    type: "group",
    name,
    avatarURL,
    memberIds: allMembers,
    createdBy: currentUserId,
    lastMessage: null,
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
  });

  for (const uid of allMembers) {
    batch.set(memberDoc(conversationRef.id, uid), {
      userId: uid,
      role: uid === currentUserId ? "owner" : "member",
      joinedAt: serverTimestamp() as never,
      lastReadMessageId: null,
      lastReadAt: null,
      lastDeliveredAt: null,
      archived: false,
      muted: false,
      pinned: false,
    });
  }

  await batch.commit();
  return conversationRef.id;
}

/** Mark the latest messages as delivered for the current user. */
export async function markDelivered(
  conversationId: string,
  userId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(memberDoc(conversationId, userId), {
    lastDeliveredAt: serverTimestamp() as never,
  });
  await batch.commit();
}

export async function updateMembership(
  conversationId: string,
  userId: string,
  data: Partial<Pick<ConversationMember, "archived" | "muted" | "pinned" | "lastReadMessageId">>,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(memberDoc(conversationId, userId), data);
  await batch.commit();
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
  lastReadMessageId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(memberDoc(conversationId, userId), {
    lastReadMessageId,
    lastReadAt: serverTimestamp() as never,
  });
  await batch.commit();
}

export { conversationDoc };
