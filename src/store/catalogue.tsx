import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  type Book,
  type Genre,
  GENRES,
  getAllBooks,
} from '@/data/books';

import {
  getOpenLibraryWork,
  searchOpenLibrary,
} from '@/services/openLibrary';

import {
  openLibrarySearchToBook,
  openLibraryWorkToBook,
} from '@/services/openLibraryAdapter';

import { googleBookToBook } from '@/services/bookAdapter';
import {
  getGoogleBookById,
  searchGoogleBooks,
} from '@/services/googleBooks';
import { db, firestoreBooksEnabled } from '@/services/firebase';
import { useAuth } from '@/store/auth';

type CatalogueValue = {
  books: Book[];
  getBookById: (id: string) => Book | undefined;
  searchBooks: (text: string, genre?: Genre | null) => Book[];
  searchExternalBooks: (
    text: string,
    startIndex?: number,
    genre?: Genre | null
  ) => Promise<{ books: Book[]; hasMore: boolean; nextIndex: number }>;
  loadExternalBook: (id: string) => Promise<Book | undefined>;
};

const CatalogueContext = createContext<CatalogueValue | null>(null);

function isBook(value: Record<string, unknown>): boolean {
  return ['title', 'author', 'hook', 'description'].every(
    (key) => typeof value[key] === 'string'
  ) &&
    GENRES.includes(value.genre as Genre) &&
    typeof value.rating === 'number' &&
    Number.isFinite(value.rating) &&
    typeof value.year === 'number' &&
    Number.isInteger(value.year) &&
    (value.coverId === undefined ||
      (typeof value.coverId === 'number' &&
        Number.isInteger(value.coverId)));
}

export function CatalogueProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [books, setBooks] = useState<Book[]>([]);
  const [externalBooks, setExternalBooks] = useState<
    Record<string, Book>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid || !db || !firestoreBooksEnabled) {
      setBooks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      query(collection(db, 'book'), orderBy('order')),
      (snapshot) => {
        const values = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        if (!values.every(isBook)) {
          setError(
            'Some books could not be loaded. Please contact the project maintainer.'
          );
        } else {
          setBooks(values as Book[]);
          setError(null);
        }

        setLoading(false);
      },
      () => {
        setLoading(false);
        setError(
          'Unable to load books. Check your connection and try again.'
        );
      }
    );
  }, [uid, attempt]);

  const localBooks = firestoreBooksEnabled
    ? books
    : getAllBooks();

  const rememberBooks = useCallback((items: Book[]) => {
    setExternalBooks((previous) => {
      const next = { ...previous };

      for (const book of items) {
        next[book.id] = book;
      }

      return next;
    });
  }, []);

  const getBookById = useCallback(
    (id: string) =>
      localBooks.find((book) => book.id === id) ??
      externalBooks[id],
    [localBooks, externalBooks]
  );

  const searchBooks = useCallback(
    (text: string, genre?: Genre | null) => {
      const term = text.trim().toLowerCase();

      return localBooks.filter(
        (book) =>
          (!genre || book.genre === genre) &&
          (!term ||
            book.title.toLowerCase().includes(term) ||
            book.author.toLowerCase().includes(term))
      );
    },
    [localBooks]
  );

  
const searchExternalBooks = useCallback(
  async (
    text: string,
    startIndex = 0,
    genre?: Genre | null
  ) => {
    const term = text.trim();

    if (!term && !genre) {
      return {
        books: [],
        hasMore: false,
        nextIndex: 0,
      };
    }

    const searchTerm = [
      term,
      genre ? `subject:${genre}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const pageSize = 20;

    try {
      // Primary provider: Google Books
      const response = await searchGoogleBooks(
        searchTerm,
        startIndex,
        pageSize
      );

      const converted = response.books.map(googleBookToBook);

      rememberBooks(converted);

      return {
        books: converted,
        hasMore: startIndex + pageSize < response.totalItems,
        nextIndex: startIndex + pageSize,
      };
    } catch (googleError) {
      // Fallback provider: Open Library
      console.warn(
        '[NextStory] Google Books unavailable. Using Open Library.'
      );

      const response = await searchOpenLibrary(
        searchTerm,
        startIndex,
        pageSize
      );

      const converted = response.books.map(
        openLibrarySearchToBook
      );

      rememberBooks(converted);

      return {
        books: converted,
        hasMore: startIndex + pageSize < response.totalItems,
        nextIndex: startIndex + pageSize,
      };
    }
  },
  [rememberBooks]
);


  
const loadExternalBook = useCallback(
  async (id: string): Promise<Book | undefined> => {
    if (id.startsWith('google:')) {
      const volumeId = id.slice('google:'.length);
      const result = await getGoogleBookById(volumeId);
      const book = googleBookToBook(result);

      rememberBooks([book]);
      return book;
    }

    if (id.startsWith('openlibrary:')) {
      const workKey = id.slice('openlibrary:'.length);
      const workId = workKey.replace(/^\/?works\//, '');

      const result = await getOpenLibraryWork(workId);
      const book = openLibraryWorkToBook(result);

      rememberBooks([book]);
      return book;
    }

    return undefined;
  },
  [rememberBooks]
);


  const value = useMemo<CatalogueValue>(
    () => ({
      books: localBooks,
      getBookById,
      searchBooks,
      searchExternalBooks,
      loadExternalBook,
    }),
    [
      localBooks,
      getBookById,
      searchBooks,
      searchExternalBooks,
      loadExternalBook,
    ]
  );

  const showStatus =
    firestoreBooksEnabled && !!uid && (loading || !!error);

  return (
    <CatalogueContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}

        {showStatus ? (
          <View
            style={[StyleSheet.absoluteFill, styles.status]}
            accessibilityViewIsModal
          >
            {loading ? <ActivityIndicator /> : null}

            <Text accessibilityRole={error ? 'alert' : undefined}>
              {error ?? 'Loading books…'}
            </Text>

            {error ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  setError(null);
                  setAttempt((value) => value + 1);
                }}
                style={{ padding: 16 }}
              >
                <Text>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </CatalogueContext.Provider>
  );
}

export function useCatalogue() {
  const context = useContext(CatalogueContext);

  if (!context) {
    throw new Error(
      'useCatalogue must be used inside CatalogueProvider'
    );
  }

  return context;
}

const styles = StyleSheet.create({
  status: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#FAFAFA',
  },
});
