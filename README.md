# NexTalk AI

A premium, real-time messaging application with built-in AI copilots, powered
entirely by **Firebase**. NexTalk AI delivers instant messaging, live
presence, typing indicators, read receipts, rich media sharing and AI features
(smart replies, rewriting, summaries, translation and a conversation assistant)
on a secure, scalable serverless backend.

> Firebase handles **authentication, database, real-time updates, file storage,
> presence and push notifications**. No Express, PostgreSQL, Prisma, Redis or
> Socket.IO is used anywhere.

---

## ✨ Features

- **Authentication** — email/password, Google sign-in, email verification,
  password reset, persistent sessions and protected routes.
- **Real-time messaging** — Firestore `onSnapshot()` listeners, optimistic
  sending, failed-message retry, duplicate prevention (`clientMessageId`),
  cursor pagination and infinite scroll.
- **Message status** — `pending → sent → delivered → seen` with one/two grey and
  two blue ticks, computed per-member for group chats.
- **Presence & typing** — online/offline + last-seen via Realtime Database with
  `onDisconnect()`, plus debounced group typing indicators.
- **Rich media** — images, videos, documents and voice notes with upload
  progress, validation, preview and error handling.
- **Reactions, replies, edit, delete** and **group chats**.
- **AI copilots** — smart replies, message rewriting, conversation summaries,
  translation, a conversation Q&A assistant, moderation and voice transcription
  — all via secure **Firebase Cloud Functions** (AI keys never touch the browser).
- **Push notifications** — browser push via Firebase Cloud Messaging.
- **Polished UX** — responsive design, light/dark mode, accessible components,
  keyboard navigation and loading/empty/error states throughout.

## 🧱 Technology Stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Framework        | Next.js (App Router) + TypeScript (strict)             |
| Styling / UI     | Tailwind CSS, shadcn/ui, Lucide React                  |
| State            | Zustand + React Context (auth)                         |
| Forms/Validation | React Hook Form + Zod                                  |
| Auth             | Firebase Authentication                                |
| Database         | Cloud Firestore (persistent) + Realtime Database (live)|
| Storage          | Firebase Storage                                       |
| Messaging        | Firebase Cloud Messaging                               |
| Serverless / AI  | Firebase Cloud Functions (+ OpenAI, server-side only)  |

## 📁 Project Structure

```text
.
├── functions/                 # Firebase Cloud Functions (AI + notifications)
│   └── src/
│       ├── ai.ts              # Callable AI functions
│       ├── notifications.ts   # onMessageCreated push trigger
│       ├── openai.ts          # OpenAI client + secret
│       └── util.ts            # Auth/membership + transcript helpers
├── public/
│   └── firebase-messaging-sw.js  # FCM background service worker
├── src/
│   ├── app/                   # Next.js routes
│   │   ├── (app)/             # Protected area (chat, profile, settings, ai)
│   │   ├── login/ register/ forgot-password/ verify-email/
│   │   └── layout.tsx page.tsx globals.css
│   ├── components/
│   │   ├── auth/              # Auth forms, guards, shell
│   │   ├── chat/             # Sidebar, room, list, bubble, composer, AI panel…
│   │   └── ui/                # shadcn primitives
│   ├── contexts/auth-context.tsx
│   ├── hooks/                 # Data hooks (messages, conversations, presence…)
│   ├── lib/
│   │   ├── firebase/          # config, auth, firestore, database, storage,
│   │   │                      #   messaging, functions, errors
│   │   ├── chat/              # conversations, messages, helpers
│   │   ├── validations/       # Zod schemas
│   │   ├── datetime.ts utils.ts
│   ├── store/                 # Zustand stores
│   └── types/                 # Shared TypeScript models
├── firestore.rules  database.rules.json  storage.rules
├── firestore.indexes.json  firebase.json  .firebaserc
└── docs/                      # Additional documentation
```

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 20+ and npm
- A Firebase project (Blaze plan required for Cloud Functions)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm i -g firebase-tools`

### 2. Install dependencies

```bash
npm install
npm --prefix functions install
```

### 3. Configure environment variables

Copy the example file and fill in your Firebase web app config:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Project settings → General → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database page |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Cloud Messaging → Web Push certificates |

> These `NEXT_PUBLIC_*` values are safe to expose (they identify your Firebase
> project). Real **secrets** (like the OpenAI key) are configured separately as
> Cloud Functions secrets and never shipped to the browser.

See **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** for step-by-step setup
of Authentication, Firestore, Realtime Database, Storage, Cloud Messaging and
Cloud Functions.

### 4. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

### 5. Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm --prefix functions run build` | Compile Cloud Functions |

## 🔥 Firebase Emulator Suite

Run the full backend locally without touching production:

```bash
firebase emulators:start
```

This starts Auth, Firestore, Realtime Database, Storage, Functions and the
Emulator UI (<http://localhost:4000>). See `firebase.json` for ports.

## 🔐 Security Rules

Hardened rules are provided for all services and deployed with:

```bash
firebase deploy --only firestore:rules,database,storage
```

Highlights (full details in **[docs/SECURITY_RULES.md](docs/SECURITY_RULES.md)**):

- Only authenticated users can access data.
- Users can only modify their own profile, membership, receipts and reactions.
- Only conversation members can read conversations and messages.
- A user cannot send a message using another user's ID.
- Only message authors can edit/delete their messages.
- Field/type validation and default-deny for everything else.

## 🤖 AI Cloud Functions

The AI provider key is stored as a Firebase secret and only used server-side:

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

Callables: `generateSmartReplies`, `rewriteMessage`, `summarizeConversation`,
`translateMessage`, `askConversationAI`, `moderateMessage`,
`transcribeVoiceMessage`, `createEmbedding`, plus the `onMessageCreated` push
trigger. See **[docs/AI_FUNCTIONS.md](docs/AI_FUNCTIONS.md)**.

> Without an OpenAI key, smart replies fall back to sensible defaults and other
> AI actions surface a friendly "AI unavailable" message — the chat app remains
> fully functional.

## 🚢 Deployment

Deploy the backend:

```bash
firebase deploy --only firestore,database,storage,functions
```

Deploy the frontend to Vercel (recommended for Next.js) or Firebase Hosting.
Set the same `NEXT_PUBLIC_*` env vars in your hosting provider. Add your
production domain to **Authentication → Settings → Authorized domains**.

## 📚 Documentation

- [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) — Firebase project setup
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture & data flow
- [docs/DATABASE_STRUCTURE.md](docs/DATABASE_STRUCTURE.md) — data models
- [docs/SECURITY_RULES.md](docs/SECURITY_RULES.md) — security model
- [docs/AI_FUNCTIONS.md](docs/AI_FUNCTIONS.md) — AI functions reference

## 📝 License

MIT — for learning and demonstration purposes.
