# Database Structure

NexTalk AI uses **Cloud Firestore** for persistent data and **Realtime
Database** for ephemeral real-time state.

## Cloud Firestore

### `users/{userId}`

```ts
{
  uid: string;
  name: string;
  username: string;        // stored lowercase for search
  email: string;
  photoURL: string | null;
  about: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Subcollection `users/{userId}/fcmTokens/{token}` — private FCM registration
tokens (readable/writable only by the owner).

### `conversations/{conversationId}`

```ts
{
  type: "direct" | "group";
  name: string | null;
  avatarURL: string | null;
  memberIds: string[];      // used for access control + list queries
  createdBy: string;
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;      // ordered desc in the conversation list
}
```

### `conversations/{conversationId}/members/{userId}`

```ts
{
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Timestamp;
  lastReadMessageId: string | null;
  lastReadAt: Timestamp | null;       // powers unread count + "seen"
  lastDeliveredAt: Timestamp | null;  // powers "delivered"
  archived: boolean;
  muted: boolean;
  pinned: boolean;
}
```

> `lastReadAt` and `lastDeliveredAt` are additions to the base spec that make
> unread counts and delivery status cheap to compute without per-message reads.

### `conversations/{conversationId}/messages/{messageId}`

```ts
{
  id: string;
  clientMessageId: string;   // duplicate-prevention key
  senderId: string;
  text: string;
  type: "text" | "image" | "video" | "file" | "audio";
  attachment: {
    url: string; name: string; contentType: string; size: number;
    width?: number; height?: number; durationMs?: number; thumbnailURL?: string;
  } | null;
  replyToId: string | null;
  editedAt: Timestamp | null;
  deletedAt: Timestamp | null;  // soft delete
  createdAt: Timestamp;
}
```

### `conversations/{c}/messages/{m}/receipts/{userId}`

```ts
{ userId: string; deliveredAt: Timestamp | null; seenAt: Timestamp | null; }
```

### `conversations/{c}/messages/{m}/reactions/{userId}`

```ts
{ userId: string; emoji: string; createdAt: Timestamp; }
```

### `notifications/{notificationId}`

```ts
{
  userId: string;
  type: "message" | "mention" | "system";
  title: string;
  body: string;
  conversationId: string | null;
  read: boolean;
  createdAt: Timestamp;
}
```

Created server-side by the `onMessageCreated` Cloud Function.

## Realtime Database

### `/status/{userId}`

```ts
{ state: "online" | "offline"; lastChanged: number; } // server timestamp
```

### `/typing/{conversationId}/{userId}`

```ts
{ isTyping: boolean; updatedAt: number; } // server timestamp
```

Typing state is **never** stored in Firestore.

## Composite indexes (`firestore.indexes.json`)

| Collection | Fields | Purpose |
| --- | --- | --- |
| `conversations` | `memberIds` (contains), `updatedAt` desc | Conversation list |
| `conversations` | `type` asc, `memberIds` (contains) | Direct-chat lookup |
| `messages` | `createdAt` desc | Message ordering + pagination |
| `notifications` | `userId` asc, `createdAt` desc | Notifications feed |
| `notifications` | `userId` asc, `read` asc, `createdAt` desc | Unread filter |

`messages` is a collection-group-style ordering used within each conversation.
