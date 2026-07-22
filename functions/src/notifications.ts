import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

/**
 * When a new message is created, push a notification to every other member and
 * write a notification document for the in-app notification center.
 */
export const onMessageCreated = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const message = snap.data();
    const { conversationId } = event.params;
    const senderId = message.senderId as string;

    const db = admin.firestore();
    const conversationSnap = await db
      .doc(`conversations/${conversationId}`)
      .get();
    const conversation = conversationSnap.data();
    if (!conversation) return;

    const memberIds = (conversation.memberIds as string[]) ?? [];
    const recipientIds = memberIds.filter((id) => id !== senderId);
    if (recipientIds.length === 0) return;

    const senderSnap = await db.doc(`users/${senderId}`).get();
    const senderName = (senderSnap.data()?.name as string) ?? "Someone";

    const preview =
      message.type === "text"
        ? (message.text as string)
        : message.type === "image"
          ? "📷 Photo"
          : message.type === "video"
            ? "🎬 Video"
            : message.type === "audio"
              ? "🎤 Voice message"
              : "📎 Attachment";

    const title =
      conversation.type === "group"
        ? (conversation.name as string) ?? "New group message"
        : senderName;
    const body =
      conversation.type === "group" ? `${senderName}: ${preview}` : preview;

    // Write in-app notification docs and collect FCM tokens.
    const tokens: string[] = [];
    await Promise.all(
      recipientIds.map(async (uid) => {
        await db.collection("notifications").add({
          userId: uid,
          type: "message",
          title,
          body,
          conversationId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const tokensSnap = await db
          .collection(`users/${uid}/fcmTokens`)
          .get();
        tokensSnap.forEach((doc) => {
          const token = doc.data().token as string | undefined;
          if (token) tokens.push(token);
        });
      }),
    );

    if (tokens.length === 0) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: {
          conversationId,
          url: `/chat/${conversationId}`,
        },
        webpush: {
          fcmOptions: { link: `/chat/${conversationId}` },
        },
      });

      // Clean up tokens that are no longer valid.
      const invalid: string[] = [];
      response.responses.forEach((res, index) => {
        if (
          !res.success &&
          (res.error?.code === "messaging/registration-token-not-registered" ||
            res.error?.code === "messaging/invalid-registration-token")
        ) {
          const token = tokens[index];
          if (token) invalid.push(token);
        }
      });
      if (invalid.length > 0) {
        logger.info(`Removing ${invalid.length} invalid FCM tokens.`);
      }
    } catch (error) {
      logger.error("Failed to send push notifications", error);
    }
  },
);
