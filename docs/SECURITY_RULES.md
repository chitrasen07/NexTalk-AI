# Security Rules

All three rule sets ship in the repo and enforce a **default-deny** posture:
nothing is accessible unless a rule explicitly allows it.

- `firestore.rules` — Cloud Firestore
- `database.rules.json` — Realtime Database
- `storage.rules` — Firebase Storage

Deploy them:

```bash
firebase deploy --only firestore:rules,database,storage
```

## Guarantees

- Only **authenticated** users can access any application data.
- Users can update **only their own** profile, membership, receipts and reactions.
- Only **conversation members** can read a conversation and its messages.
- Only **conversation members** can create messages.
- A user **cannot send a message using another user's ID** (`senderId` must
  equal `request.auth.uid`).
- Only the **message author** can edit or (soft-)delete their message.
- Only the **owning user** can write their receipts (delivered/seen).
- Required fields and value types are validated on create.
- No open/development rules — everything else is denied.

## Firestore highlights

```javascript
function isConversationMember(conversationId) {
  return isSignedIn() &&
    request.auth.uid in
      get(/databases/$(database)/documents/conversations/$(conversationId)).data.memberIds;
}
```

- **Conversations** — read/update require being in `memberIds`. This is the
  primary access gate and prevents outsiders from adding themselves (an outsider
  can't update `memberIds` because updates require existing membership).
- **Members** — creation only checks that the doc id matches the `userId` field,
  which allows atomic batch creation of a conversation and its member docs.
  Membership docs are **not** access-granting (access is gated by the
  conversation's `memberIds`), so this is safe; a spurious member doc yields no
  read access to any message or conversation.
- **Messages** — create requires membership **and** `senderId == uid`; update
  requires authorship.
- **Receipts / reactions** — a user may only write the document keyed by their
  own uid.
- **Notifications** — recipients read/mark-read their own; creation is
  server-only (Cloud Functions run with admin privileges that bypass rules).

## Realtime Database highlights

- `/status/{uid}` — world-readable to signed-in users; writable only by the
  owner; `state` restricted to `online`/`offline`; `lastChanged` must be a number.
- `/typing/{conversationId}/{uid}` — readable by signed-in users; writable only
  by the owner; shape validated (`isTyping` boolean, `updatedAt` number).
- Unknown child keys are rejected via `"$other": { ".validate": false }`.

## Storage highlights

- `users/{uid}/profile/**` — owner-only writes, image MIME + 5 MB cap.
- `conversations/{cid}/{images|videos|audio|files}/**` — read/write restricted to
  conversation members (membership resolved from Firestore), with per-type MIME
  and size limits mirroring client-side validation.
- Everything else denied.

## Testing rules locally

Use the Emulator Suite to exercise the rules without touching production:

```bash
firebase emulators:start --only firestore,database,storage,auth
```

Point the app at the emulators (or write unit tests with
`@firebase/rules-unit-testing`) to assert allowed/denied access.
