import { useCallback, useEffect, useState } from 'react';

import type { BookReview } from '@/data/reviews';
import { reviewError, subscribeToBookReviews } from '@/services/reviews';

/** Mount with a reader/book key so changing accounts or books discards stale state. */
export function useBookReviews(bookId: string) {
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const timer = setTimeout(() => {
      if (active) {
        setLoading(false);
        setError('Unable to confirm the latest reviews. Check your connection and retry.');
      }
    }, 15000);
    const onError = (failure: unknown) => {
      clearTimeout(timer);
      if (!active) return;
      setLoading(false);
      setError(reviewError(failure));
    };
    try {
      unsubscribe = subscribeToBookReviews(bookId, (items, cached) => {
        if (!active) return;
        if (!cached) clearTimeout(timer);
        setReviews(items);
        setFromCache(cached);
        setLoading(false);
        setError('');
      }, onError);
    } catch (failure) {
      // Keep setup failures asynchronous, like listener failures.
      void Promise.resolve().then(() => onError(failure));
    }
    return () => { active = false; clearTimeout(timer); unsubscribe(); };
  }, [bookId, attempt]);

  const retry = useCallback(() => {
    setError('');
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  return { reviews, loading, error, fromCache, retry };
}
