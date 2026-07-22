import type {
  ClientMessage,
  Conversation,
  ConversationMember,
  MessageStatus,
  UserProfile,
} from "@/types";
import { toDate } from "@/lib/datetime";

export interface ConversationDisplay {
  title: string;
  photoURL: string | null;
  otherUserId: string | null;
  subtitle: string | null;
}

/**
 * Derive the display title/avatar for a conversation from the current user's
 * perspective. Direct chats show the other participant; groups show the group.
 */
export function getConversationDisplay(
  conversation: Conversation,
  currentUserId: string,
  profiles: Record<string, UserProfile>,
): ConversationDisplay {
  if (conversation.type === "group") {
    return {
      title: conversation.name ?? "Group chat",
      photoURL: conversation.avatarURL,
      otherUserId: null,
      subtitle: `${conversation.memberIds.length} members`,
    };
  }
  const otherId =
    conversation.memberIds.find((id) => id !== currentUserId) ?? null;
  const other = otherId ? profiles[otherId] : null;
  return {
    title: other?.name ?? "Direct message",
    photoURL: other?.photoURL ?? null,
    otherUserId: otherId,
    subtitle: other?.username ? `@${other.username}` : null,
  };
}

/**
 * Compute the delivery status of the current user's own message from the other
 * members' delivered/read timestamps. Falls back to the optimistic status for
 * pending/failed local messages.
 */
export function computeOwnMessageStatus(
  message: ClientMessage,
  currentUserId: string,
  members: ConversationMember[],
): MessageStatus {
  if (message.status === "pending" || message.status === "failed") {
    return message.status;
  }
  const createdAt = toDate(message.createdAt);
  if (!createdAt) return "sent";

  const others = members.filter((m) => m.userId !== currentUserId);
  if (others.length === 0) return "sent";

  const seenByAll = others.every((m) => {
    const readAt = toDate(m.lastReadAt);
    return readAt ? readAt.getTime() >= createdAt.getTime() : false;
  });
  if (seenByAll) return "seen";

  const deliveredToAll = others.every((m) => {
    const deliveredAt = toDate(m.lastDeliveredAt);
    const readAt = toDate(m.lastReadAt);
    const latest = Math.max(
      deliveredAt ? deliveredAt.getTime() : 0,
      readAt ? readAt.getTime() : 0,
    );
    return latest >= createdAt.getTime();
  });
  if (deliveredToAll) return "delivered";

  return "sent";
}

/** Build the "X, Y and N others are typing…" label. */
export function formatTypingLabel(
  typingUserIds: string[],
  profiles: Record<string, UserProfile>,
): string | null {
  if (typingUserIds.length === 0) return null;
  const names = typingUserIds.map(
    (id) => profiles[id]?.name?.split(" ")[0] ?? "Someone",
  );
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]} and ${names.length - 1} others are typing…`;
}
