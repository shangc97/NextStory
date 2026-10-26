
import { useCatalogue } from '@/store/catalogue';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SwipeDeck } from '@/components/swipe-deck';
import {
  EmptyState,
  OptionBar,
  OutlineButton,
  PrimaryButton,
  Screen,
  ScreenTitle,
} from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { type Book, type Genre, GENRES } from '@/data/books';
import { useLibrary } from '@/store/library';

const LOAD_THRESHOLD = 5;
const MAX_AUTO_PAGES = 4;

/**
 * Discover combines:
 * - Existing Firebase catalogue books
 * - Google Books results
 * - Open Library results when Google Books fails
 *
 * Existing Like, Skip and Save actions are unchanged.
 */
export default function DiscoverScreen() {
  const router = useRouter();

  const { books, searchExternalBooks } = useCatalogue();

  const {
    error: syncError,
    hydrated,
    liked,
    skipped,
    saved,
    like,
    skip,
    toggleSaved,
    restartDeck,
  } = useLibrary();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [genre, setGenre] = useState<Genre | null>(null);

  const [externalBooks, setExternalBooks] = useState<Book[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [externalError, setExternalError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageCount, setPageCount] = useState(0);

  // Keep pagination independent of React render timing.
  const nextIndexRef = useRef(0);
  const hasMoreRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const generationRef = useRef(0);

  /**
   * Fetch the next page of external books.
   *
   * The catalogue provider handles the Google Books
   * to Open Library fallback automatically.
   */
  const loadPage = useCallback(
    async (
      selectedGenre: Genre | null,
      generation: number
    ) => {
      if (
        requestInFlightRef.current ||
        !hasMoreRef.current
      ) {
        return;
      }

      requestInFlightRef.current = true;
      setLoadingExternal(true);
      setExternalError('');

      try {
        const startIndex = nextIndexRef.current;

        const result = await searchExternalBooks(
          selectedGenre ? '' : 'fiction',
          startIndex,
          selectedGenre
        );

        // Ignore results from an old genre selection.
        if (generation !== generationRef.current) {
          return;
        }

        setExternalBooks((previous) => {
          const existingIds = new Set(
            previous.map((book) => book.id)
          );

          const newBooks = result.books.filter(
            (book) => !existingIds.has(book.id)
          );

          return [...previous, ...newBooks];
        });

        nextIndexRef.current = result.nextIndex;
        hasMoreRef.current = result.hasMore;

        setHasMore(result.hasMore);
        setPageCount((count) => count + 1);
      } catch (error) {
        if (generation !== generationRef.current) {
          return;
        }

        console.warn(
          '[NextStory Discover] Unable to load external books:',
          error instanceof Error ? error.message : 'Unknown error'
        );

        setExternalError(
          'Unable to load more books. Please try again.'
        );
      } finally {
        if (generation === generationRef.current) {
          requestInFlightRef.current = false;
          setLoadingExternal(false);
          setInitialized(true);
        }
      }
    },
    [searchExternalBooks]
  );

  /**
   * Start a new external catalogue when the user
   * opens Discover or changes the genre.
   */
  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;

    nextIndexRef.current = 0;
    hasMoreRef.current = true;
    requestInFlightRef.current = false;

    setExternalBooks([]);
    setExternalError('');
    setHasMore(true);
    setPageCount(0);
    setInitialized(false);
    setLoadingExternal(false);

    if (hydrated && !syncError) {
      void loadPage(genre, generation);
    }

    return () => {
      generationRef.current += 1;
    };
  }, [genre, hydrated, syncError, loadPage]);

  /**
   * Combine Firebase and external books.
   * Deduplicate by book ID.
   */
  const combinedBooks = [
    ...books,
    ...externalBooks.filter(
      (external) =>
        !books.some((local) => local.id === external.id)
    ),
  ];

  // Never show books already liked or skipped.
  const seen = new Set([...liked, ...skipped]);

  const deck = combinedBooks.filter(
    (book) =>
      !seen.has(book.id) &&
      (!genre || book.genre === genre)
  );

  /**
   * Automatically request more books when the deck
   * has five or fewer cards remaining.
   *
   * Limit automatic pages to avoid excessive API calls.
   */
  useEffect(() => {
    if (
      !hydrated ||
      syncError ||
      !initialized ||
      loadingExternal ||
      externalError ||
      !hasMore ||
      pageCount >= MAX_AUTO_PAGES ||
      deck.length > LOAD_THRESHOLD
    ) {
      return;
    }

    void loadPage(genre, generationRef.current);
  }, [
    hydrated,
    syncError,
    initialized,
    loadingExternal,
    externalError,
    hasMore,
    pageCount,
    deck.length,
    genre,
    loadPage,
  ]);

  const retryLoading = () => {
    if (loadingExternal) return;

    void loadPage(genre, generationRef.current);
  };

  const filtersButton = (
    <Pressable
      onPress={() => setFiltersOpen((open) => !open)}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityState={{ expanded: filtersOpen }}
    >
      <Text
        style={[
          styles.filters,
          (filtersOpen || genre) && styles.filtersActive,
        ]}
      >
        {genre ? `Filters · ${genre}` : 'Filters'}
      </Text>
    </Pressable>
  );

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        subtitle="Discover your next read."
        right={filtersButton}
      >
        NextStory
      </ScreenTitle>

      {filtersOpen ? (
        <View style={styles.filterBar}>
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
      ) : null}

      {syncError ? (
        <Text accessibilityRole="alert">
          {syncError}
        </Text>
      ) : !hydrated ? (
        <Text>Loading your library…</Text>
      ) : deck.length > 0 ? (
        <>
          <View style={styles.directions}>
            <Text style={styles.direction}>
              {'< SKIP'}
            </Text>
            <Text style={styles.direction}>
              LIKE
            </Text>
          </View>

          <SwipeDeck
            key={genre ?? 'all'}
            books={deck}
            savedIds={saved}
            onLike={(book) => like(book.id)}
            onSkip={(book) => skip(book.id)}
            onToggleSave={(book) =>
              toggleSaved(book.id)
            }
            onOpen={(book) =>
              router.push({
                pathname: '/book/[id]',
                params: {
                  id: book.id,
                  from: 'discover',
                },
              })
            }
          />

          <Text style={styles.hint}>
            Swipe the card left or right to discover.
          </Text>

          {loadingExternal ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.statusText}>
                Finding more books…
              </Text>
            </View>
          ) : null}

          {externalError ? (
            <View style={styles.statusSection}>
              <Text
                accessibilityRole="alert"
                style={styles.statusText}
              >
                {externalError}
              </Text>

              <OutlineButton
                label="Try again"
                onPress={retryLoading}
              />
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyWrap}>
          {loadingExternal || !initialized ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator />
              <Text style={styles.statusText}>
                Finding books for you…
              </Text>
            </View>
          ) : (
            <>
              <EmptyState
                title={
                  externalError
                    ? 'Could not load more books'
                    : "You're all caught up"
                }
                body={
                  externalError ||
                  (genre
                    ? `There are no more ${genre} books to show right now.`
                    : 'You have been through the currently loaded books.')
                }
              />

              {externalError ? (
                <OutlineButton
                  label="Try again"
                  onPress={retryLoading}
                />
              ) : null}

              {!externalError && hasMore ? (
                <OutlineButton
                  label="Find more books"
                  onPress={retryLoading}
                />
              ) : null}

              {genre ? (
                <OutlineButton
                  label="Show all genres"
                  onPress={() => setGenre(null)}
                />
              ) : null}

              {skipped.length > 0 ? (
                <PrimaryButton
                  label="See skipped books again"
                  onPress={restartDeck}
                  style={styles.emptyButton}
                />
              ) : null}
            </>
          )}
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loadingSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusSection: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
});
