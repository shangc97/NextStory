
import { useCatalogue } from '@/store/catalogue';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BookRow } from '@/components/book-row';
import {
  EmptyState,
  OptionBar,
  OutlineButton,
  Screen,
  ScreenTitle,
  SectionHeading,
  TextField,
} from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import {
  type Book,
  formatRating,
  type Genre,
  GENRES,
} from '@/data/books';

export default function SearchScreen() {
  const router = useRouter();
  const { searchBooks, searchExternalBooks } = useCatalogue();

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);
  const [external, setExternal] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const requestId = useRef(0);

  const localResults = searchBooks(query, genre);

  useEffect(() => {
    const currentRequest = ++requestId.current;

    setExternal([]);
    setHasMore(false);
    setNextIndex(0);
    setError('');

    if (!query.trim() && !genre) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setLoading(true);
    setLoadingMore(false);

    const timer = setTimeout(async () => {
      try {
        const result = await searchExternalBooks(
          query,
          0,
          genre
        );

        if (requestId.current !== currentRequest) return;

        setExternal(result.books);
        setHasMore(result.hasMore);
        setNextIndex(result.nextIndex);
      } catch {
        if (requestId.current !== currentRequest) return;

        setError(
          'Unable to search Google Books. Check your connection.'
        );
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      requestId.current += 1;
    };
  }, [query, genre, searchExternalBooks]);

  const loadMore = async () => {
    if (!hasMore || loading || loadingMore) return;

    const currentRequest = requestId.current;
    setLoadingMore(true);
    setError('');

    try {
      const result = await searchExternalBooks(
        query,
        nextIndex,
        genre
      );

      if (requestId.current !== currentRequest) return;

      setExternal((previous) => {
        const existingIds = new Set(
          previous.map((book) => book.id)
        );

        return [
          ...previous,
          ...result.books.filter(
            (book) => !existingIds.has(book.id)
          ),
        ];
      });

      setHasMore(result.hasMore);
      setNextIndex(result.nextIndex);
    } catch {
      if (requestId.current === currentRequest) {
        setError('Unable to load more books. Try again.');
      }
    } finally {
      if (requestId.current === currentRequest) {
        setLoadingMore(false);
      }
    }
  };

  const results = [
    ...localResults,
    ...external.filter(
      (book) =>
        !localResults.some(
          (local) => local.id === book.id
        )
    ),
  ];

  return (
    <Screen scroll>
      <ScreenTitle subtitle="Find a title or author.">
        Search
      </ScreenTitle>

      <TextField
        placeholder="Search books or authors..."
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search books or authors"
      />

      <View style={styles.section}>
        <SectionHeading>Popular genres</SectionHeading>
        <OptionBar
          options={GENRES}
          selected={genre}
          onSelect={(option) =>
            setGenre((current) =>
              current === option ? null : option
            )
          }
        />
      </View>

      <SectionHeading>Results</SectionHeading>

      {results.map((book) => (
        <BookRow
          key={book.id}
          book={book}
          meta={`${book.genre} · ${
            book.rating > 0
              ? formatRating(book.rating)
              : 'Not rated'
          }`}
          onPress={() =>
            router.push({
              pathname: '/book/[id]',
              params: { id: book.id, from: 'search' },
            })
          }
        />
      ))}

      {loading ? (
        <ActivityIndicator style={styles.status} />
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {!loading && results.length === 0 && !error ? (
        <EmptyState
          title="No books found"
          body="Try a different title, author, or genre."
        />
      ) : null}

      {hasMore && !loading ? (
        <OutlineButton
          label={loadingMore ? 'Loading...' : 'Load more books'}
          disabled={loadingMore}
          onPress={loadMore}
          style={styles.loadMore}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  status: {
    marginVertical: Spacing.lg,
  },
  error: {
    color: Colors.muted,
    marginVertical: Spacing.md,
  },
  loadMore: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
