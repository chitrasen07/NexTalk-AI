import type { Timestamp } from "firebase/firestore";

/** Firestore: users/{userId} */
export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL: string | null;
  about: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type ConversationType = "direct" | "group";

/** Firestore: conversations/{conversationId} */
export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarURL: string | null;
  memberIds: string[];
  createdBy: string;
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: Timestamp | null;
  } | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type MemberRole = "owner" | "admin" | "member";

/** Firestore: conversations/{conversationId}/members/{userId} */
export interface ConversationMember {
  userId: string;
  role: MemberRole;
  joinedAt: Timestamp | null;
  lastReadMessageId: string | null;
  /** Timestamp of the last read; used for unread + "seen" status. */
  lastReadAt: Timestamp | null;
  /** Timestamp of the last delivered message; used for "delivered" status. */
  lastDeliveredAt: Timestamp | null;
  archived: boolean;
  muted: boolean;
  pinned: boolean;
}

export type MessageType = "text" | "image" | "video" | "file" | "audio";

/** Optimistic/local delivery status shown in the UI. */
export type MessageStatus = "pending" | "sent" | "delivered" | "seen" | "failed";

export interface MessageAttachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  durationMs?: number;
  thumbnailURL?: string;
}

/** Firestore: conversations/{conversationId}/messages/{messageId} */
export interface Message {
  id: string;
  clientMessageId: string;
  senderId: string;
  text: string;
  type: MessageType;
  attachment: MessageAttachment | null;
  replyToId: string | null;
  editedAt: Timestamp | null;
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

/** Message augmented with UI-only, client-side state. */
export interface ClientMessage extends Message {
  status: MessageStatus;
  /** Local send progress (0-100) for optimistic messages with uploads. */
  uploadProgress?: number;
}

/** Firestore: conversations/{c}/messages/{m}/receipts/{userId} */
export interface MessageReceipt {
  userId: string;
  deliveredAt: Timestamp | null;
  seenAt: Timestamp | null;
}

/** Firestore: conversations/{c}/messages/{m}/reactions/{userId} */
export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Timestamp | null;
}

/** Firestore: notifications/{notificationId} */
export interface AppNotification {
  id: string;
  userId: string;
  type: "message" | "mention" | "system";
  title: string;
  body: string;
  conversationId: string | null;
  read: boolean;
  createdAt: Timestamp | null;
}

/** Realtime Database: /status/{userId} */
export interface PresenceState {
  state: "online" | "offline";
  lastChanged: number;
}

/** Realtime Database: /typing/{conversationId}/{userId} */
export interface TypingState {
  isTyping: boolean;
  updatedAt: number;
}

/** UI type combining a conversation with the current user's member doc. */
export interface ConversationListItem {
  conversation: Conversation;
  member: ConversationMember | null;
  unreadCount: number;
  otherUser: UserProfile | null;
}
