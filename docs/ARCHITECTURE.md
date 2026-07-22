# Architecture

ChatSphere AI is a Next.js (App Router) front end talking directly to Firebase
services, with Cloud Functions handling privileged/AI work.

```text
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                       │
│                                                                │
│  React UI ── Zustand (UI state) ── AuthContext (session)       │
│     │                                                          │
│     ├── Firebase Auth ........ sign-in / session restore       │
│     ├── Firestore listeners .. conversations, messages (live)  │
│     ├── Realtime DB .......... presence + typing (onDisconnect)│
│     ├── Storage .............. uploads (resumable + progress)  │
│     ├── Callable Functions ... AI features (secure)            │
│     └── FCM SW ............... background push notifications    │
└──────────────────────────────────────────────────────────────┘
             │                                   ▲
             ▼                                   │
┌──────────────────────────┐        ┌───────────────────────────┐
│      Firebase (managed)   │        │      Cloud Functions       │
│  Auth · Firestore · RTDB  │──────▶ │  onMessageCreated (push)   │
│  Storage · FCM            │        │  AI callables (OpenAI)     │
└──────────────────────────┘        └───────────────────────────┘
```

## Layered design

### Service layer (`src/lib/firebase`)
Thin, typed wrappers around the Firebase SDKs. Each file owns one service:
`config`, `auth`, `firestore`, `database`, `storage`, `messaging`, `functions`,
`errors`. UI components never import the raw SDK directly.

### Domain layer (`src/lib/chat`)
Higher-level operations built on the service layer: creating conversations,
sending messages with batch writes, pagination, receipts, reactions and display
helpers (title/avatar/status derivation).

### Hooks (`src/hooks`)
Bridge Firebase's imperative listeners to React state while guaranteeing
**cleanup on unmount / dependency change** (no duplicate or leaked listeners):

- `useConversations`, `useConversation`, `useConversationMembers`, `useMyMembership`
- `useMessages` — realtime + optimistic + pagination + retry
- `usePresence`, `useTyping`, `useReactions`
- `useVoiceRecorder`, `useMediaQuery`

### State (`src/store`)
- `chat-store` — active conversation, reply/edit targets, drafts, AI panel,
  sidebar and upload UI state.
- `profiles-store` — a cache of `UserProfile`s with de-duplicated fetching.

Firebase listeners remain the **source of truth for server state**; Zustand only
holds ephemeral client/UI state.

## Message lifecycle

```text
User types ─▶ optimistic message (status: pending) added locally
          ─▶ batch write: create message + update conversation.lastMessage
          ─▶ Firestore listener returns the server copy
          ─▶ optimistic entry dropped (matched by clientMessageId)  ← dedupe
          ─▶ recipient's client writes delivered/seen receipts
          ─▶ sender's UI shows sent → delivered → seen ticks
```

- **Duplicate prevention:** every message carries a `clientMessageId`; the
  optimistic copy is removed once a server message with the same id arrives.
- **Failed sends:** on error the optimistic message flips to `failed` and can be
  retried, reusing the same `clientMessageId`.
- **Pagination:** the realtime listener owns the newest page; older pages are
  fetched with a `createdAt` cursor (`startAfter`) and prepended while scroll
  position is preserved.

## Status derivation

Delivered/seen are derived efficiently from the members subcollection:

- `lastReadAt` → **seen** (blue double tick)
- `lastDeliveredAt` → **delivered** (grey double tick)

A per-message `receipts` subcollection is also maintained (spec-compliant, and
useful for granular/group receipts and analytics).

## Presence & typing

Realtime Database is used for ephemeral state:

- `/status/{uid}` — set online on connect, and `onDisconnect()` sets offline so
  a crash/close still updates status. Uses server timestamps.
- `/typing/{conversationId}/{uid}` — debounced; cleared after ~2s of inactivity,
  on send, and via `onDisconnect()` to avoid stale indicators.

## Routing & protection

- Route group `(app)` wraps `/chat`, `/profile`, `/settings`, `/ai` in
  `ProtectedRoute`, which waits for session restoration before redirecting
  (the login page never flashes for authenticated users).
- `/login` and `/register` use `PublicOnlyRoute` to bounce signed-in users to
  `/chat`.
- Unverified email/password users are redirected to `/verify-email`.
