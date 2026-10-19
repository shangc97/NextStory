import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { type Book, type Genre, GENRES, getAllBooks } from '@/data/books';
import { db, firestoreBooksEnabled } from '@/services/firebase';
import { useAuth } from '@/store/auth';

const CatalogueContext = createContext<Book[] | null>(null);

function isBook(value: Record<string, unknown>): boolean {
  return ['title', 'author', 'hook', 'description'].every((key) => typeof value[key] === 'string')
    && GENRES.includes(value.genre as Genre)
    && typeof value.rating === 'number' && Number.isFinite(value.rating)
    && typeof value.year === 'number' && Number.isInteger(value.year)
    && (value.coverId === undefined || (typeof value.coverId === 'number' && Number.isInteger(value.coverId)));
}

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!uid || !db || !firestoreBooksEnabled) return;
    return onSnapshot(query(collection(db, 'book'), orderBy('order')), (snapshot) => {
      const values = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      if (!values.every(isBook)) {
        setError('Some books could not be loaded. Please contact the project maintainer.');
      } else {
        setBooks(values as Book[]);
        setError(null);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
      setError('Unable to load books. Check your connection and try again.');
    });
  }, [uid, attempt]);

  const showStatus = firestoreBooksEnabled && !!uid && (loading || !!error);
  return <CatalogueContext.Provider value={firestoreBooksEnabled ? books : getAllBooks()}>
    <View style={{ flex: 1 }}>
      {children}
      {showStatus ? <View style={[StyleSheet.absoluteFill, styles.status]} accessibilityViewIsModal>
        {loading ? <ActivityIndicator /> : null}
        <Text accessibilityRole={error ? 'alert' : undefined}>{error ?? 'Loading books…'}</Text>
        {error ? <Pressable accessibilityRole="button" onPress={() => { setLoading(true); setError(null); setAttempt((value) => value + 1); }} style={{ padding: 16 }}>
          <Text>Try again</Text>
        </Pressable> : null}
      </View> : null}
    </View>
  </CatalogueContext.Provider>;
}

export function useCatalogue() {
  const books = useContext(CatalogueContext);
  if (!books) throw new Error('useCatalogue must be used inside CatalogueProvider');
  return {
    books,
    getBookById: (id: string) => books.find((book) => book.id === id),
    searchBooks: (queryText: string, genre?: Genre | null) => {
      const term = queryText.trim().toLowerCase();
      return books.filter((book) => (!genre || book.genre === genre)
        && (!term || book.title.toLowerCase().includes(term) || book.author.toLowerCase().includes(term)));
    },
  };
}

const styles = StyleSheet.create({
  status: { justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16, backgroundColor: '#FAFAFA' },
});
