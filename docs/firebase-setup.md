# Firebase setup

The shared project also has the singular `book` catalogue. See [book collection setup](firestore-books.md) for its import, access rules, and activation flag.

NextStory now uses Firebase Authentication for email/password accounts and Cloud Firestore for each reader's saved books and latest swipe state. Likes record interest for future recommendations; saves belong to the reading list. Passwords are managed by Authentication and never stored in Firestore.

The top-level `like` collection is enabled separately with `EXPO_PUBLIC_FIRESTORE_LIKES_ENABLED=true`. See [like collection setup](firestore-likes.md). Existing swipe paths remain in use for compatibility.

## Current scope

- Sign up, log in, log out, and persist the mobile authentication session using AsyncStorage.
- Create a private user profile on signup; retry missing profile creation on login.
- Subscribe to the authenticated user's saved books and swipes, and write changes to Firestore.
- Protect app routes while signed out and discard the previous account's library when accounts change.
- Prepare schemas and rules for preferences, shared book metadata, and reviews.

With `EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED=true`, discovery, search, reading lists, and book details use the Firestore `book` catalogue. The bundled catalogue remains available when the flag is false. Google Books integration remains future work. Preferences/reviews screens, recommendations, AI, and library availability are future work. Existing device-only demo lists are not imported into an account or deleted.

## Team onboarding

The shared project is **nextstory-1555a**. Its Email/Password provider, default Firestore database, and rules were configured in the Firebase console by the project maintainer. Team members should use this same project rather than creating separate projects.

1. Ask the maintainer for Firebase project access using your own Google account. Access is managed under Project settings → Users and permissions.
2. Open Project settings → General → Your apps and find the registered **Web (`</>`) app**. This Expo app uses the Firebase JS SDK, including on iOS/Android.
3. Copy `.env.example` to `.env.local`. Map the Web app's `firebaseConfig` values to the six variables in that file.
4. Install dependencies and restart Expo after setting the environment variables:

```bash
npm ci
cp .env.example .env.local
# Fill in .env.local from the console's firebaseConfig before starting Expo.
npx expo start --clear
```

`.env.local` and `WIP/` are ignored by Git; `.env.example` is tracked with empty values. `EXPO_PUBLIC_*` values are included in the client bundle and identify the Firebase project. Authentication and Security Rules protect the data. Never put Admin SDK credentials or service account private keys in this file or the app.

Firebase JS SDK works with Expo Go. No native Firebase config files, native project folders, config plugin, or Hosting setup are required for this integration. The Expo Go version must support this project's Expo SDK 57.

Project console: https://console.firebase.google.com/project/nextstory-1555a/overview

## Console setup for a new environment

For a separate development project, a maintainer must:

1. Register a Firebase Web app and obtain its client configuration.
2. Start Authentication and enable **Email/Password** (email-link sign-in is not implemented).
3. Create the **Standard / Native mode**, default `(default)` Firestore database in **Production mode**. Choose its location deliberately for the team and users.
4. Paste the full contents of `firestore.rules` into Firestore → Rules and publish. Do not use allow-all test rules.
5. Update each developer's `.env.local` and restart Expo.

For browser deployment, also review Authentication's Authorized domains.

## Optional rules deployment

A maintainer with Firebase CLI access can deploy the tracked rules:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project nextstory-1555a
```

`firebase.json` also references `firestore.indexes.json`. Current collection subscriptions need no composite indexes. The tracked index file is empty; reconcile existing remote indexes before deploying it to a shared project. This change does not automatically deploy rules or indexes.

## Data model and permissions

| Path | Fields and purpose | Access |
| --- | --- | --- |
| `users/{uid}` | `displayName`, `preferences: { genres: [], authors: [] }`, `createdAt`, `updatedAt` | Owner reads/creates/updates; profile deletion is not implemented |
| `users/{uid}/savedBooks/{bookId}` | `bookId`, `createdAt`; personal reading list | Owner reads/creates/deletes |
| `users/{uid}/swipes/{bookId}` | `bookId`, `direction: like or skip`, `updatedAt`; latest interest state | Owner reads/creates/updates/deletes |
| `like/{userId}_{bookId}` | `userId`, `bookId`, `updatedAt`; per-reader likes | Owner-only reads/writes; queries filter by current user |
| `book/{bookId}` | Active shared catalogue; see book setup for fields | Signed-in reads; trusted administrative writes only |
| `books/{bookId}` | Legacy reserved metadata path; not used by the UI | Signed-in reads; writes only through trusted administrative tools |
| `books/{bookId}/reviews/{uid}` | Reserved for one review per reader/book: integer `rating` 1–5, `content` up to 2,000 characters, `updatedAt` | Signed-in reads; author creates/updates/deletes |

Collections appear on the first document write; empty collections do not need to be created manually. Swipe records represent the latest state per book, not an append-only event history. The current sample IDs (for example `dune`) need a mapping strategy before adopting Google Books IDs.

Mobile authentication persistence uses AsyncStorage. Persistent mobile offline Firestore caching is not implemented. Clearing reading activity deletes the authenticated user's saved books and swipes after confirmation.

## Verification commands

```bash
npm run lint
npm run typecheck
npm run firebase:check
npm run firebase:test
```

`firebase:check` sends read-only setup probes. It does not create accounts/documents, and a PASS does not certify every rule or application flow.

`firebase:test` runs against the project in `.env.local`. It creates temporary Authentication accounts and Saved/Swipe documents, then deletes those test resources in `finally`. Cleanup failures print the specific test account and path for manual removal. It does not create `users/{uid}` profile documents because the current rules do not allow deleting them.

Actual cloud checks passed:

- Email signup, display-name update, logout, and password login.
- Reading the current account's profile path before profile creation.
- Saved-book writes/reads/collection queries and realtime subscription.
- Like/skip persistence and rejection of invalid swipe directions.
- Rejection of another account's private-data reads/writes/queries.
- Rejection of signed-out reads and successful owner deletion of activity.
- Cleanup of all temporary accounts and activity documents.

Lint, TypeScript, and iOS/Web export passed. The app was launched in the iPhone 17 Pro simulator with SDK-compatible Expo Go and the login screen was inspected. The maintainer also reported completing their simulator test. Automated cloud checks do not cover profile creation or mobile session restoration; confirm those in the app as part of review.

## Reviewer app checks

1. Create an account and confirm both Authentication's user and Firestore `users/{uid}` profile exist.
2. Save/like/skip a sample book and inspect the account's savedBooks/swipes documents.
3. Restart the app and confirm session and library restoration.
4. Log out and sign in with another account; confirm its list is separate.
5. Open the same account on a second device and confirm changes synchronize.

If signup creates an Auth account but profile saving fails, check the published rules and project configuration, then log in again to retry creating the missing profile. If permissions fail immediately after publishing rules, retry once propagation has completed.

## References

- https://docs.expo.dev/guides/using-firebase/
- https://docs.expo.dev/guides/environment-variables/
- https://docs.expo.dev/router/advanced/authentication/
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/firestore/security/rules-conditions
