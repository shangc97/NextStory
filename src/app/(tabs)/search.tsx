import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookRow } from '@/components/book-row';
import { EmptyState, OptionBar, Screen, ScreenTitle, SectionHeading, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatRating, Genre, GENRES, searchBooks } from '@/data/books';

/**
 * Wireframe 05 — Search.
 *
 * Searches the built-in catalogue by title or author. Tapping a genre narrows
 * the results; tapping it again clears it. `searchBooks` is the function to
 * replace with a Google Books API call later.
 */
export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);

  const results = searchBooks(query, genre);

  return (
    <Screen scroll>
      <ScreenTitle subtitle="Find a title or author.">Search</ScreenTitle>

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
          onSelect={(option) => setGenre((current) => (current === option ? null : option))}
        />
      </View>

      <SectionHeading>Results</SectionHeading>
      {results.length > 0 ? (
        results.map((book) => (
          <BookRow
            key={book.id}
            book={book}
            meta={`${book.genre} · ${formatRating(book.rating)}`}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id, from: 'search' } })}
          />
        ))
      ) : (
        <EmptyState title="No books found" body="Try a different title, author, or genre." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
