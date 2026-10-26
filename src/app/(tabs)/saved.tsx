
import { useCatalogue } from '@/store/catalogue';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
} from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { type Book } from '@/data/books';
import { useLibrary } from '@/store/library';

const LISTS = ['Saved', 'Liked', 'Read'] as const;
type ListName = (typeof LISTS)[number];

/**
 * Wireframe 07 — Saved books ("My reading list").
 *
 * Saved = bookmarked books.
 * Liked = books swiped right.
 * Read = planned for a future sprint.
 *
 * Supports both Firebase catalogue books and Google Books.
 * Missing Google Books metadata is fetched by volume ID.
 */
export default function SavedScreen() {
  const router = useRouter();

  const { getBookById, loadExternalBook } = useCatalogue();

  const {
    saved,
    liked,
    toggleSaved,
    removeLiked,
  } = useLibrary();

  const [list, setList] = useState<ListName>('Saved');

  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Select the IDs belonging to the current list.
  const ids =
    list === 'Saved'
      ? saved
      : list === 'Liked'
        ? liked
        : [];

  // Resolve IDs using the shared catalogue.
  const books = ids
    .map(getBookById)
    .filter((book): book is Book => book !== undefined);

  // Find external books that aren't currently cached.
  const missingExternalIds = ids.filter(
  (id) =>
    (id.startsWith('google:') ||
      id.startsWith('openlibrary:')) &&
    !getBookById(id)
);

  // Stable dependency representing the current missing IDs.
  const missingKey = [...missingExternalIds].sort().join('|');

  /**
   * Retrieve missing Google Books metadata.
   *
   * This handles books saved in an earlier session.
   * Existing Firebase books do not require API requests.
   */
  useEffect(() => {
    if (missingExternalIds.length === 0) {
      setLoadingBooks(false);
      setLoadError('');
      return;
    }

    let active = true;

    setLoadingBooks(true);
    setLoadError('');

    async function restoreBooks() {
      const results = await Promise.allSettled(
        missingExternalIds.map((id) =>
          loadExternalBook(id)
        )
      );

      if (!active) return;

      const failed = results.some(
        (result) => result.status === 'rejected'
      );

      if (failed) {
        setLoadError(
          'Some books could not be loaded. Check your connection and try again.'
        );
      }

      setLoadingBooks(false);
    }

    restoreBooks();

    return () => {
      active = false;
    };
  }, [missingKey, loadExternalBook, retryCount]);

  const emptyCopy: Record<
    ListName,
    { title: string; body: string }
  > = {
    Saved: {
      title: 'Nothing saved yet',
      body: 'Tap the bookmark on a book in Discover to keep it here.',
    },
    Liked: {
      title: 'No liked books yet',
      body: 'Swipe right on a book in Discover and it will show up here.',
    },
    Read: {
      title: 'No finished books yet',
      body: 'Marking books as read arrives together with reviews in a later sprint.',
    },
  };

  const showEmpty =
    books.length === 0 &&
    !loadingBooks &&
    !loadError;

  return (
    <Screen scroll>
      <ScreenTitle subtitle="Books you want to return to.">
        My reading list
      </ScreenTitle>

      {/* Existing Saved / Liked / Read switcher */}
      <View style={styles.switcher}>
        <OptionBar
          options={LISTS}
          selected={list}
          onSelect={setList}
        />
      </View>

      {/* Loading external books */}
      {loadingBooks ? (
        <View style={styles.status}>
          <ActivityIndicator />
          <Text style={styles.statusText}>
            Loading your books…
          </Text>
        </View>
      ) : null}

      {/* API error and retry */}
      {loadError ? (
        <View style={styles.errorSection}>
          <Text
            accessibilityRole="alert"
            style={styles.statusText}
          >
            {loadError}
          </Text>

          <OutlineButton
            label="Try again"
            onPress={() =>
              setRetryCount((value) => value + 1)
            }
          />
        </View>
      ) : null}

      {/* Existing book list */}
      {books.length > 0 ? (
        <>
          {books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              meta={`${list} · Tap to view`}
              onPress={() =>
                router.push({
                  pathname: '/book/[id]',
                  params: {
                    id: book.id,
                    from: 'saved',
                  },
                })
              }
              onRemove={() =>
                list === 'Saved'
                  ? toggleSaved(book.id)
                  : removeLiked(book.id)
              }
            />
          ))}

          <Text style={styles.hint}>
            Open a book to view its details.
          </Text>
        </>
      ) : showEmpty ? (
        <EmptyState
          title={emptyCopy[list].title}
          body={emptyCopy[list].body}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switcher: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },

  status: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },

  statusText: {
    fontSize: 14,
    color: Colors.muted,
  },

  errorSection: {
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },

  hint: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: Colors.muted,
  },
});
