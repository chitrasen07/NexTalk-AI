# AI Cloud Functions

All AI features run inside **Firebase Cloud Functions**. The AI provider key is
stored as a Firebase **secret** and is **never** exposed to the browser. The
frontend invokes these through Firebase **callable functions**
(`src/lib/firebase/functions.ts`).

## Configuration

```bash
# Store the key as a secret (prompts for the value)
firebase functions:secrets:set OPENAI_API_KEY

# Deploy
firebase deploy --only functions
```

Model defaults (see `functions/src/openai.ts`):

- Chat / text: `gpt-4o-mini`
- Embeddings: `text-embedding-3-small`
- Transcription: `whisper-1`
- Moderation: `omni-moderation-latest`

> **Graceful degradation:** if `OPENAI_API_KEY` is not set, `generateSmartReplies`
> returns sensible fallback replies and `moderateMessage` returns "not flagged";
> the remaining functions throw `failed-precondition` and the UI shows a friendly
> "AI unavailable" toast. The chat app keeps working without AI.

## Callable functions

| Function | Request | Response |
| --- | --- | --- |
| `generateSmartReplies` | `{ conversationId, messageText }` | `{ replies: string[] }` |
| `rewriteMessage` | `{ text, tone }` | `{ text: string }` |
| `summarizeConversation` | `{ conversationId, messageCount? }` | `{ summary: string }` |
| `translateMessage` | `{ text, targetLanguage }` | `{ text: string }` |
| `askConversationAI` | `{ conversationId, question }` | `{ answer: string }` |
| `moderateMessage` | `{ text }` | `{ flagged, categories[] }` |
| `transcribeVoiceMessage` | `{ audioUrl }` | `{ transcript: string }` |
| `createEmbedding` | `{ text }` | `{ embedding: number[] }` |

`tone` ∈ `professional | friendly | concise | expanded | grammar`.

### Authorization

- Every function requires an authenticated caller (`request.auth`).
- Conversation-scoped functions (`generateSmartReplies`, `summarizeConversation`,
  `askConversationAI`) additionally verify the caller is a **member** of the
  conversation via `assertConversationMember()` before reading any messages.

### Example (frontend)

```ts
import { callRewriteMessage } from "@/lib/firebase/functions";

const res = await callRewriteMessage({ text: draft, tone: "professional" });
console.log(res.data.text);
```

## Background trigger

### `onMessageCreated`

Firestore trigger on `conversations/{conversationId}/messages/{messageId}`:

1. Loads the conversation and computes the recipient list (all members except
   the sender).
2. Writes an in-app `notifications/{id}` document per recipient.
3. Collects each recipient's FCM tokens and sends a multicast push
   (`sendEachForMulticast`) with a deep link to the conversation.
4. Flags invalid/expired tokens for cleanup.

The background push is displayed by `public/firebase-messaging-sw.js`; foreground
messages are surfaced as in-app toasts (`AppPresence`).

## Local development

```bash
npm --prefix functions run build
firebase emulators:start --only functions,firestore,auth
```

Provide the secret to the emulator via a local `.secret.local` or the
`--project` you've configured; see the Firebase docs on testing functions with
secrets.
