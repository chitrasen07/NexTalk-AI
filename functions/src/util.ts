import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

export interface MessageDoc {
  id: string;
  senderId: string;
  text: string;
  type: string;
  createdAt: admin.firestore.Timestamp | null;
}

/** Ensure the caller is authenticated and a member of the conversation. */
export async function assertConversationMember(
  uid: string | undefined,
  conversationId: string,
): Promise<void> {
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  const memberSnap = await admin
    .firestore()
    .doc(`conversations/${conversationId}/members/${uid}`)
    .get();
  if (!memberSnap.exists) {
    throw new HttpsError(
      "permission-denied",
      "You are not a member of this conversation.",
    );
  }
}

/** Fetch the most recent messages of a conversation as plain text lines. */
export async function fetchRecentMessages(
  conversationId: string,
  limit = 40,
): Promise<MessageDoc[]> {
  const snap = await admin
    .firestore()
    .collection(`conversations/${conversationId}/messages`)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  const messages = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      senderId: data.senderId as string,
      text: (data.text as string) ?? "",
      type: (data.type as string) ?? "text",
      createdAt: (data.createdAt as admin.firestore.Timestamp) ?? null,
    };
  });
  return messages.reverse();
}

/** Build a readable transcript from message docs with display names. */
export async function buildTranscript(
  conversationId: string,
  messages: MessageDoc[],
): Promise<string> {
  const uniqueSenders = Array.from(new Set(messages.map((m) => m.senderId)));
  const names = new Map<string, string>();
  await Promise.all(
    uniqueSenders.map(async (uid) => {
      const userSnap = await admin.firestore().doc(`users/${uid}`).get();
      names.set(uid, (userSnap.data()?.name as string) ?? "User");
    }),
  );
  return messages
    .filter((m) => m.text)
    .map((m) => `${names.get(m.senderId) ?? "User"}: ${m.text}`)
    .join("\n");
}
