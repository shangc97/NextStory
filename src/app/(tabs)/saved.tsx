import { useCatalogue } from '@/store/catalogue';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BookRow } from '@/components/book-row';
import { EmptyState, OptionBar, Screen, ScreenTitle } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { Book } from '@/data/books';
import { useLibrary } from '@/store/library';

const LISTS = ['Saved', 'Liked', 'Read'] as const;
type ListName = (typeof LISTS)[number];

/**
 * Wireframe 07 — Saved books ("My reading list").
 *
 * Saved = bookmarked books, Liked = books swiped right. "Read" is in the
 * wireframe but depends on the reviews feature, so it is an empty list for now.
 */
export default function SavedScreen() {
  const router = useRouter();
  const { getBookById } = useCatalogue();
  const { saved, liked, toggleSaved, removeLiked } = useLibrary();
  const [list, setList] = useState<ListName>('Saved');

  const ids = list === 'Saved' ? saved : list === 'Liked' ? liked : [];
  const books = ids.map(getBookById).filter((book): book is Book => book !== undefined);

  const emptyCopy: Record<ListName, { title: string; body: string }> = {
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

  return (
    <Screen scroll>
      <ScreenTitle subtitle="Books you want to return to.">My reading list</ScreenTitle>

      <View style={styles.switcher}>
        <OptionBar options={LISTS} selected={list} onSelect={setList} />
      </View>

      {books.length > 0 ? (
        <>
          {books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              meta={`${list} · Tap to view`}
              onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id, from: 'saved' } })}
              onRemove={() => (list === 'Saved' ? toggleSaved(book.id) : removeLiked(book.id))}
            />
          ))}
          <Text style={styles.hint}>Open a book to view its details.</Text>
        </>
      ) : (
        <EmptyState title={emptyCopy[list].title} body={emptyCopy[list].body} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switcher: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  hint: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: Colors.muted,
  },
});
