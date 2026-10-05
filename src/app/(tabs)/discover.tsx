import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SwipeDeck } from '@/components/swipe-deck';
import { EmptyState, OptionBar, OutlineButton, PrimaryButton, Screen, ScreenTitle } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { Genre, GENRES, getAllBooks } from '@/data/books';
import { useLibrary } from '@/store/library';

/**
 * Wireframe 04 — Main screen (swipe deck).
 *
 * Swipe right = Like, swipe left = Skip, bookmark = Save (separate from Like).
 * The deck is every book the user has not liked or skipped yet. The
 * recommendation logic planned for later sprints only needs to change how
 * `deck` is ordered.
 */
export default function DiscoverScreen() {
  const router = useRouter();
  const { hydrated, liked, skipped, saved, like, skip, toggleSaved, restartDeck } = useLibrary();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [genre, setGenre] = useState<Genre | null>(null);

  const seen = new Set([...liked, ...skipped]);
  const deck = getAllBooks().filter((book) => !seen.has(book.id) && (!genre || book.genre === genre));

  const filtersButton = (
    <Pressable
      onPress={() => setFiltersOpen((open) => !open)}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityState={{ expanded: filtersOpen }}>
      <Text style={[styles.filters, (filtersOpen || genre) && styles.filtersActive]}>
        {genre ? `Filters · ${genre}` : 'Filters'}
      </Text>
    </Pressable>
  );

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle subtitle="Discover your next read." right={filtersButton}>
        NextStory
      </ScreenTitle>

      {filtersOpen ? (
        <View style={styles.filterBar}>
          <OptionBar
            options={GENRES}
            selected={genre}
            onSelect={(option) => setGenre((current) => (current === option ? null : option))}
          />
        </View>
      ) : null}

      {!hydrated ? null : deck.length > 0 ? (
        <>
          <View style={styles.directions}>
            <Text style={styles.direction}>{'< SKIP'}</Text>
            <Text style={styles.direction}>LIKE</Text>
          </View>

          <SwipeDeck
            books={deck}
            savedIds={saved}
            onLike={(book) => like(book.id)}
            onSkip={(book) => skip(book.id)}
            onToggleSave={(book) => toggleSaved(book.id)}
            onOpen={(book) => router.push({ pathname: '/book/[id]', params: { id: book.id, from: 'discover' } })}
          />

          <Text style={styles.hint}>Swipe the card left or right to discover.</Text>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="You're all caught up"
            body={
              genre
                ? `There are no more ${genre} books to show right now.`
                : 'You have been through every book in the sample catalogue.'
            }
          />
          {genre ? <OutlineButton label="Show all genres" onPress={() => setGenre(null)} /> : null}
          {skipped.length > 0 ? (
            <PrimaryButton label="See skipped books again" onPress={restartDeck} style={styles.emptyButton} />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.md,
  },
  filters: {
    fontSize: 14,
    color: Colors.muted,
  },
  filtersActive: {
    color: Colors.ink,
    fontWeight: '700',
  },
  filterBar: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  directions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  direction: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.ink,
  },
  hint: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyButton: {
    marginTop: Spacing.md,
  },
});
