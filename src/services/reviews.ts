import { collection, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

import { type BookReview, validateReview } from '@/data/reviews';
import { requireFirebase } from '@/services/firebase';

function reviewCollection(bookId: string) {
  if (!bookId || bookId.includes('/') || bookId === '.' || bookId === '..' || bookId.length > 200) {
    throw new Error('This book has an invalid review identifier.');
  }
  return collection(requireFirebase().db, 'books', bookId, 'reviews');
}

export function reviewError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied') return 'Reviews are not available for this account. Sign in again or contact the project maintainer, then retry.';
  if (code === 'unauthenticated') return 'Sign in again to access reviews.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Unable to connect to reviews. Check your internet connection and retry.';
  return error instanceof Error && !code ? error.message : 'Unable to access reviews. Please try again.';
}

export function subscribeToBookReviews(
  bookId: string,
  onReviews: (reviews: BookReview[], fromCache: boolean) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(reviewCollection(bookId), { includeMetadataChanges: true }, (snapshot) => {
    // Local writes are not presented as published reviews until the server acknowledges them.
    if (snapshot.metadata.hasPendingWrites) return;
    // An empty local cache cannot tell us whether a book has any reviews on the server.
    if (snapshot.metadata.fromCache && snapshot.empty) return;
    const reviews: BookReview[] = snapshot.docs.flatMap((item) => {
      const data = item.data();
      if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5 || typeof data.content !== 'string') return [];
      return [{
        userId: item.id,
        rating: data.rating,
        content: data.content,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : null,
      }];
    });
    reviews.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.userId.localeCompare(b.userId));
    onReviews(reviews, snapshot.metadata.fromCache);
  }, onError);
}

export async function saveBookReview(bookId: string, rating: number | null, content: string): Promise<void> {
  const error = validateReview(rating, content);
  if (error) throw new Error(error);
  const { auth } = requireFirebase();
  if (!auth.currentUser) throw new Error('Sign in to post a review.');
  // The signed-in user's UID is the document ID: repeat submissions update one review.
  await setDoc(doc(reviewCollection(bookId), auth.currentUser.uid), {
    rating,
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
}
