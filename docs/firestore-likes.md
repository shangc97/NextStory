# Firestore like collection

This adds per-reader likes to top-level `like` while retaining existing swipe records. The shared project's like rules were deployed on 2026-10-18, and its one existing real like was copied from the legacy path without deleting the original.

## Schema and permissions

Path: `like/{userId}_{bookId}`

| Field | Value |
| --- | --- |
| `userId` | Firebase Authentication UID |
| `bookId` | Original catalogue book ID |
| `updatedAt` | Server timestamp |

The deterministic document ID prevents duplicate records for repeated likes. Queries must filter by the current user: `where('userId', '==', uid)`. Rules allow only that user to read, create, update, and delete their records. Updates cannot take over an existing record owned by another user. Unknown fields, malformed document IDs, and invalid book ID/timestamp fields are rejected. Signed-out access is denied.

## App behavior

Enable `EXPO_PUBLIC_FIRESTORE_LIKES_ENABLED=true` in `.env.local` and restart Expo. This is independent of `EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED`; either can be toggled separately. In another Firebase project, deploy the reviewed owner rules before enabling likes.

- Like: atomically write the new like document and the existing `users/{uid}/swipes/{bookId}` record.
- Skip: atomically write the skip and delete the matching like document; skipping a never-liked book also works.
- Remove liked book: atomically delete both records.
- Clear reading activity: delete the current user's likes, saved books, and swipe records in bounded batches. The full multi-batch clear is not atomic and can partially complete on failure.
- Realtime reads: merge and deduplicate the user's top-level likes and legacy liked swipes. Wait for all library subscriptions before permitting changes.
- Account changes: the root provider remounts per account, preventing the previous reader's list from appearing for the next user.

Legacy swipes remain readable even when they have not been copied to `like`. The feature performs no automatic bulk migration. There is no placeholder like document; an empty collection appears after the first real like. Saved-book paths are unchanged.

Setting the flag to `false` restores legacy swipe-only behavior and does not delete top-level like documents. Legacy clients do not keep the new collection synchronized; if users keep both client versions active, reconcile stale top-level likes before re-enabling the new mode.

## Validation

Run `npm run lint` and `npm run typecheck`.

Run `npm run firebase:test` with the likes flag enabled to include:

- Atomic like creation and realtime owner-query delivery.
- Repeated likes using one deterministic document.
- Rejection of another account's reads, queries, writes, and deletes.
- Rejection of unknown fields and malformed IDs.
- Atomic skip/deletion, including deleting an already absent like.
- Matching user swipe state after like/skip; removing a like clears both paths.
- A rejected like batch preserves the previous user swipe and leaves the like collection unchanged.
- Rejection of signed-out like queries.

The smoke script uses temporary accounts and activity records and removes them in cleanup. It does not create persistent user profile documents. No cloud import or rules deployment is performed by preparing this PR.

Manual app checks: like a book, confirm it appears under Liked, remove it, reload, and switch accounts. The shared project's previous cloud checks passed; verify this branch with the commands above before merging.
