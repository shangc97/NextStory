# Firestore book catalogue

The app can load its catalogue from `book/{bookId}` instead of the bundled sample list. The shared `nextstory-1555a` project was seeded with 25 books on 2026-10-18. Original book IDs are preserved so saved-book and swipe references still resolve. Ratings are sample values.

## Schema and access

Each document contains `id`, `title`, `author`, `genre`, `rating`, `year`, `hook`, `description`, optional `coverId`, and `order`. The importer copies content from `src/data/books.seed.json` and adds its zero-based catalogue position as `order`.

Signed-in users can read the catalogue. Client writes and deletes are denied; only a trusted administrative identity can import or edit shared data. The app subscribes once per signed-in session, ordered by `order`, and shares the result across Discover, Search, Saved, and Book details. Every document must have `order` to appear in the query. Invalid book fields show a load error and retry action. The navigator stays mounted beneath the loading/error overlay.

The plural `books` path remains reserved for compatibility. This feature reads the singular `book` path.

## Enable in the app

Copy `.env.example` to `.env.local`, fill in the shared Firebase client configuration, and keep `EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED=true`. Restart Expo after changing environment values. Set the flag to `false` for the bundled demo catalogue.

For a different Firebase project, import the books and deploy the matching rules before enabling the flag. A failed cloud read shows an error instead of silently replacing data with local samples.

## Seed a new project

Validate without cloud writes:

```sh
npm run firebase:seed:check
npm run test:seed
```

The administrative importer uses `gcloud auth print-access-token`, or a short-lived `FIRESTORE_ACCESS_TOKEN` supplied in the process environment. Firebase CLI login alone does not authenticate this importer. Google Cloud Shell includes `gcloud`; run from a copy of this repository with the intended project ID:

```sh
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID node scripts/seed-books.mjs --write
```

For a local environment with administrator authentication and `.env.local` configured, run `npm run firebase:seed`.

The importer creates missing documents only. Existing book documents are preserved, with no writes to user profiles, saved books, or swipe records. Existing documents must already have the expected fields, including `order`. The script stops and reports progress if an operation fails; rerunning does not overwrite earlier imports. Do not put administrator credentials in the app bundle or commit local environment files.

Review the complete rules before deploying to another environment:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
```

The shared project already has catalogue read rules deployed. This PR does not trigger a deployment or change remote indexes.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test:seed`: mocked HTTP checks cover dry-run behavior, all 25 document payloads, deterministic order, preserving existing documents, and stopping/reporting on permission errors.
- `npm run firebase:seed:check`: validates local book data without cloud writes.
- `npm run firebase:test` with the flag enabled: checks authenticated catalogue reads, preserved sample ID/order, rejected client writes/deletes, and rejected signed-out queries alongside the existing account/activity smoke checks. It creates temporary accounts/activity and cleans them up; no profile documents are created.

The shared project's seed and catalogue permissions were verified during setup. The iPhone 17 Pro / iOS 26.5 simulator also displayed the cloud catalogue in Search after restoring its existing session. New signup profile creation and manual interactions still require their own app checks.
