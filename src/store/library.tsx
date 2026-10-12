import { collection, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { db } from '@/services/firebase';
import { useAuth } from '@/store/auth';

type LibraryData = { saved: string[]; liked: string[]; skipped: string[] };
const EMPTY: LibraryData = { saved: [], liked: [], skipped: [] };
type LibraryValue = LibraryData & {
  userName: string | null; hydrated: boolean; error: string | null;
  like: (id: string) => void; skip: (id: string) => void;
  toggleSaved: (id: string) => void; removeLiked: (id: string) => void;
  restartDeck: () => void; resetAll: () => void;
};
const LibraryContext = createContext<LibraryValue | null>(null);
export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<{ uid?: string; data: LibraryData; hydrated: boolean; error: string | null }>({ uid, data: EMPTY, hydrated: false, error: null });
  useEffect(() => {
    if (!uid || !db) return;
    let savedReady = false;
    let swipesReady = false;
    const fail = () => setState((previous) => ({ ...previous, error: 'Unable to sync your library. Check your connection and try signing in again.' }));
    const stopSaved = onSnapshot(collection(db, 'users', uid, 'savedBooks'), (snapshot) => {
      savedReady = true;
      setState((previous) => ({ ...previous, hydrated: savedReady && swipesReady, data: { ...previous.data, saved: snapshot.docs.map((item) => item.id) } }));
    }, fail);
    const stopSwipes = onSnapshot(collection(db, 'users', uid, 'swipes'), (snapshot) => {
      swipesReady = true;
      const liked: string[] = [], skipped: string[] = [];
      snapshot.docs.forEach((item) => { (item.data().direction === 'like' ? liked : skipped).push(item.id); });
      setState((previous) => ({ ...previous, hydrated: savedReady && swipesReady, data: { ...previous.data, liked, skipped } }));
    }, fail);
    return () => { stopSaved(); stopSwipes(); };
  }, [uid]);
  // Never expose one account's library after an account switch.
  const data = state.uid === uid && uid ? state.data : EMPTY;
  const hydrated = !!uid && state.uid === uid && state.hydrated;
  const error = state.uid === uid ? state.error : null;
  function run(operation: () => Promise<void>) {
    if (!uid || !db || !hydrated || error) {
      Alert.alert('Library unavailable', 'Wait for your library to sync before changing it.');
      return;
    }
    operation().catch(() => Alert.alert('Could not save', 'Your change was not saved. Check your connection and try again.'));
  }
  function swipe(id: string, direction: 'like' | 'skip') {
    run(() => setDoc(doc(db!, 'users', uid!, 'swipes', id), { bookId: id, direction, updatedAt: serverTimestamp() }));
  }
  async function clear(subcollection: 'savedBooks' | 'swipes', skippedOnly = false) {
    const database = db!;
    const documents = (await getDocs(collection(database, 'users', uid!, subcollection))).docs.filter((item) => !skippedOnly || item.data().direction === 'skip');
    for (let start = 0; start < documents.length; start += 450) {
      const batch = writeBatch(database);
      documents.slice(start, start + 450).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
  }
  return <LibraryContext.Provider value={{
    ...data, hydrated, error, userName: user?.displayName || null,
    like: (id) => swipe(id, 'like'), skip: (id) => swipe(id, 'skip'),
    toggleSaved: (id) => run(() => data.saved.includes(id)
      ? deleteDoc(doc(db!, 'users', uid!, 'savedBooks', id))
      : setDoc(doc(db!, 'users', uid!, 'savedBooks', id), { bookId: id, createdAt: serverTimestamp() })),
    removeLiked: (id) => run(() => deleteDoc(doc(db!, 'users', uid!, 'swipes', id))),
    restartDeck: () => run(() => clear('swipes', true)),
    resetAll: () => run(async () => { await clear('savedBooks'); await clear('swipes'); }),
  }}>{children}</LibraryContext.Provider>;
}
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}
