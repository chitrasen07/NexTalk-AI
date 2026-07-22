import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type {
  Conversation,
  ConversationMember,
  Message,
  MessageReaction,
  MessageReceipt,
  UserProfile,
} from "@/types";

/* -------------------------------------------------------------------------- */
/*                                 Converters                                  */
/* -------------------------------------------------------------------------- */

function makeConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (value: T): DocumentData => value,
    fromFirestore: (snapshot: QueryDocumentSnapshot): T =>
      ({ ...(snapshot.data() as T), id: snapshot.id }) as T,
  };
}

const userConverter = makeConverter<UserProfile>();
const conversationConverter = makeConverter<Conversation>();
const memberConverter = makeConverter<ConversationMember>();
const messageConverter = makeConverter<Message>();
const receiptConverter = makeConverter<MessageReceipt>();
const reactionConverter = makeConverter<MessageReaction>();

/* -------------------------------------------------------------------------- */
/*                              Collection refs                               */
/* -------------------------------------------------------------------------- */

export const usersCol = () => collection(db, "users").withConverter(userConverter);
export const userDoc = (uid: string) =>
  doc(db, "users", uid).withConverter(userConverter);

export const conversationsCol = () =>
  collection(db, "conversations").withConverter(conversationConverter);
export const conversationDoc = (id: string) =>
  doc(db, "conversations", id).withConverter(conversationConverter);

export const membersCol = (conversationId: string) =>
  collection(db, "conversations", conversationId, "members").withConverter(
    memberConverter,
  );
export const memberDoc = (conversationId: string, userId: string) =>
  doc(db, "conversations", conversationId, "members", userId).withConverter(
    memberConverter,
  );

export const messagesCol = (conversationId: string) =>
  collection(db, "conversations", conversationId, "messages").withConverter(
    messageConverter,
  );
export const messageDoc = (conversationId: string, messageId: string) =>
  doc(db, "conversations", conversationId, "messages", messageId).withConverter(
    messageConverter,
  );

export const receiptsCol = (conversationId: string, messageId: string) =>
  collection(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId,
    "receipts",
  ).withConverter(receiptConverter);
export const receiptDoc = (
  conversationId: string,
  messageId: string,
  userId: string,
) =>
  doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId,
    "receipts",
    userId,
  ).withConverter(receiptConverter);

export const reactionsCol = (conversationId: string, messageId: string) =>
  collection(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId,
    "reactions",
  ).withConverter(reactionConverter);
export const reactionDoc = (
  conversationId: string,
  messageId: string,
  userId: string,
) =>
  doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId,
    "reactions",
    userId,
  ).withConverter(reactionConverter);

/* -------------------------------------------------------------------------- */
/*                                User profiles                               */
/* -------------------------------------------------------------------------- */

export async function createUserProfile(
  uid: string,
  data: { name: string; username: string; email: string; photoURL: string | null },
): Promise<void> {
  await setDoc(userDoc(uid), {
    uid,
    name: data.name,
    username: data.username,
    email: data.email,
    photoURL: data.photoURL,
    about: "Hey there! I'm using NexTalk AI.",
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
  });
}

export async function ensureUserProfile(
  uid: string,
  data: { name: string; username: string; email: string; photoURL: string | null },
): Promise<void> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) {
    await createUserProfile(uid, data);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, "name" | "username" | "about" | "photoURL">>,
): Promise<void> {
  await updateDoc(userDoc(uid), {
    ...data,
    updatedAt: serverTimestamp() as never,
  });
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(userDoc(uid), (snap: DocumentSnapshot<UserProfile>) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

/** Fetch several user profiles by id (chunked to respect the 30-item `in` limit). */
export async function getUsersByIds(ids: string[]): Promise<UserProfile[]> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  const results: UserProfile[] = [];
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    if (chunk.length === 0) continue;
    const snap = await getDocs(
      query(usersCol(), where(documentId(), "in", chunk)),
    );
    snap.forEach((d) => results.push(d.data()));
  }
  return results;
}

export async function searchUsersByUsername(
  term: string,
  max = 50,
): Promise<UserProfile[]> {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return [];
  const snap = await getDocs(
    query(
      usersCol(),
      orderBy("username"),
      where("username", ">=", normalized),
      where("username", "<=", `${normalized}\uf8ff`),
      fbLimit(max),
    ),
  );
  return snap.docs.map((d) => d.data());
}

/**
 * Load registered users so anyone can browse and start a chat.
 * Uses username ordering (always present) with a plain-collection fallback.
 */
export async function listAllUsers(
  excludeUid: string | null,
  max = 100,
): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(
      query(usersCol(), orderBy("username"), fbLimit(max)),
    );
    return snap.docs
      .map((d) => d.data())
      .filter((u) => u.uid !== excludeUid && Boolean(u.username));
  } catch {
    // Fallback if an index/orderBy fails — still return whoever we can read.
    const snap = await getDocs(query(usersCol(), fbLimit(max)));
    return snap.docs
      .map((d) => d.data())
      .filter((u) => u.uid !== excludeUid && Boolean(u.username))
      .sort((a, b) => a.username.localeCompare(b.username));
  }
}

/**
 * Find people by username or display name. Empty search = all registered users.
 */
export async function findPeople(
  term: string,
  excludeUid: string | null,
  max = 100,
): Promise<UserProfile[]> {
  const all = await listAllUsers(excludeUid, max);
  const normalized = term.trim().toLowerCase();
  if (!normalized) return all;

  const byUsername = await searchUsersByUsername(normalized, max).catch(
    () => [] as UserProfile[],
  );

  const filtered = all.filter(
    (u) =>
      u.name.toLowerCase().includes(normalized) ||
      u.username.toLowerCase().includes(normalized) ||
      u.email.toLowerCase().includes(normalized),
  );

  const map = new Map<string, UserProfile>();
  for (const u of [...byUsername, ...filtered]) {
    if (u.uid === excludeUid) continue;
    map.set(u.uid, u);
  }
  return Array.from(map.values()).slice(0, max);
}

export { serverTimestamp, writeBatch, onSnapshot, query, orderBy, where, fbLimit as limit, startAfter, getDocs, getDoc, addDoc, updateDoc, setDoc, doc, collection };
