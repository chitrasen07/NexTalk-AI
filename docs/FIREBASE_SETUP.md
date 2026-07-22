# Firebase Setup

This guide walks through configuring every Firebase service NexTalk AI uses.

## 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click
   **Add project**.
2. Enable Google Analytics if you like (optional).
3. Upgrade to the **Blaze (pay-as-you-go)** plan — required for Cloud Functions
   and outbound network calls (OpenAI). The free tier quotas still apply.

## 2. Register a Web App

1. Project Overview → **Add app** → **Web** (`</>`).
2. Register the app (no Hosting needed here).
3. Copy the `firebaseConfig` values into your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

## 3. Authentication

1. **Build → Authentication → Get started**.
2. Enable **Email/Password**.
3. Enable **Google** (choose a support email).
4. Under **Settings → Authorized domains**, add `localhost` and your production
   domain.

Email verification and password reset emails are handled automatically by
Firebase using the default templates (customizable under **Templates**).

## 4. Cloud Firestore

1. **Build → Firestore Database → Create database**.
2. Start in **production mode** (we ship real rules).
3. Choose a region close to your users.
4. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Firestore will also prompt you to create any missing composite index via a
console link the first time a query needs it — the required indexes are already
declared in `firestore.indexes.json`.

## 5. Realtime Database (presence & typing)

1. **Build → Realtime Database → Create database**.
2. Start in **locked mode**.
3. Copy the database URL into `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   (e.g. `https://your-project-default-rtdb.firebaseio.com`).
4. Deploy rules:

```bash
firebase deploy --only database
```

## 6. Firebase Storage

1. **Build → Storage → Get started** (production mode).
2. Confirm the bucket name matches `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
3. Deploy rules:

```bash
firebase deploy --only storage
```

## 7. Cloud Messaging (push notifications)

1. **Project settings → Cloud Messaging**.
2. Under **Web configuration → Web Push certificates**, click **Generate key
   pair**.
3. Copy the key into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

The service worker at `public/firebase-messaging-sw.js` receives the public web
config via query parameters during registration — no secrets are committed.

## 8. Cloud Functions (AI + notifications)

1. Install function deps: `npm --prefix functions install`.
2. Set the AI provider secret (never exposed to the client):

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

3. Deploy:

```bash
firebase deploy --only functions
```

## 9. Link the local project

```bash
firebase login
firebase use --add   # select your project, alias it "default"
```

This updates `.firebaserc`. Now `firebase deploy` targets your project.

## 10. Verify

- `npm run dev`, register an account, verify the email, and start a chat.
- Open a second browser/incognito to test real-time delivery, presence and
  typing indicators.
- Trigger AI features from the composer (✨), the AI Copilot panel, or `/ai`.

### Troubleshooting

- **`auth/invalid-api-key`** — env vars missing or wrong; check `.env.local`.
- **Push not received** — VAPID key missing, notifications blocked, or you are
  testing on `http://` (push requires HTTPS or `localhost`).
- **AI "unavailable"** — the `OPENAI_API_KEY` secret isn't set or functions
  aren't deployed.
- **Missing index errors** — deploy `firestore.indexes.json` or click the
  console link in the error.
