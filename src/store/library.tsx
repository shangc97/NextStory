import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

/**
 * The user's library: what they saved, liked and skipped.
 *
 * For the Sprint 3 demo this lives on the device (AsyncStorage). When Firebase
 * is added, this provider is the only place that has to change: replace the
 * load/save code with Firestore reads and writes and keep the same actions.
 */

const STORAGE_KEY = 'nextstory/library/v1';

type LibraryData = {
  /** Book ids on the reading list (bookmark button). */
  saved: string[];
  /** Book ids the user swiped right on. */
  liked: string[];
  /** Book ids the user swiped left on. */
  skipped: string[];
  /** Display name typed on the Create account screen (no real account yet). */
  userName: string | null;
};

const EMPTY: LibraryData = { saved: [], liked: [], skipped: [], userName: null };

type LibraryContextValue = LibraryData & {
  /** False until the stored library has been read from the device. */
  hydrated: boolean;
  like: (bookId: string) => void;
  skip: (bookId: string) => void;
  toggleSaved: (bookId: string) => void;
  removeLiked: (bookId: string) => void;
  /** Bring skipped books back into the deck. */
  restartDeck: () => void;
  /** Clear everything. Handy before a demo. */
  resetAll: () => void;
  setUserName: (name: string | null) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function without(list: string[], id: string) {
  return list.filter((item) => item !== id);
}

function withItem(list: string[], id: string) {
  return list.includes(id) ? list : [id, ...list];
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LibraryData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const stored = JSON.parse(raw) as Partial<LibraryData>;
        setData({ ...EMPTY, ...stored });
      })
      .catch(() => {
        // Unreadable storage should never block the app; start empty.
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, hydrated]);

  const value: LibraryContextValue = {
    ...data,
    hydrated,
    like: (bookId) =>
      setData((prev) => ({
        ...prev,
        liked: withItem(prev.liked, bookId),
        skipped: without(prev.skipped, bookId),
      })),
    skip: (bookId) =>
      setData((prev) => ({
        ...prev,
        skipped: withItem(prev.skipped, bookId),
        liked: without(prev.liked, bookId),
      })),
    toggleSaved: (bookId) =>
      setData((prev) => ({
        ...prev,
        saved: prev.saved.includes(bookId) ? without(prev.saved, bookId) : withItem(prev.saved, bookId),
      })),
    removeLiked: (bookId) => setData((prev) => ({ ...prev, liked: without(prev.liked, bookId) })),
    restartDeck: () => setData((prev) => ({ ...prev, skipped: [] })),
    resetAll: () => setData((prev) => ({ ...EMPTY, userName: prev.userName })),
    setUserName: (userName) => setData((prev) => ({ ...prev, userName })),
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return context;
}
