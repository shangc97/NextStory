import { useCatalogue } from '@/store/catalogue';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppTabBar, isTabName } from '@/components/app-tab-bar';
import { BookCover } from '@/components/book-cover';
import { EmptyState, OutlineButton, PrimaryButton, Screen, ScreenTitle, SectionHeading } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { formatRating } from '@/data/books';
import { useLibrary } from '@/store/library';

/**
 * Wireframe 06 — Book details.
 *
 * Opened from Discover, Search or the reading list; `from` remembers which tab
 * to highlight. Library availability and Reviews & ratings are shown as in the
 * wireframe but stay disabled until their sprints.
 */
export default function BookDetailsScreen() {
  const router = useRouter();
  const { getBookById } = useCatalogue();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { saved, toggleSaved } = useLibrary();

  const book = getBookById(id);
  const activeTab = isTabName(from) ? from : 'discover';
  const isSaved = book ? saved.includes(book.id) : false;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  const tabBar = <AppTabBar active={activeTab} onSelect={(tab) => router.navigate(`/${tab}`)} />;

  if (!book) {
    return (
      <Screen footer={tabBar}>
        <ScreenTitle onBack={goBack}>Book details</ScreenTitle>
        <EmptyState title="Book not found" body="This book is not in the catalogue." />
      </Screen>
    );
  }

  return (
    <Screen scroll footer={tabBar}>
      <ScreenTitle onBack={goBack}>Book details</ScreenTitle>

      <View style={styles.summary}>
        <BookCover book={book} style={styles.cover} labelSize={12} />
        <View style={styles.summaryText}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.meta}>
            {book.genre} · {formatRating(book.rating)}
          </Text>
          <Text style={styles.caption}>First published {book.year} · sample rating</Text>
        </View>
      </View>

      <PrimaryButton
        label={isSaved ? 'Saved to my reading list ✓' : 'Save to my reading list'}
        onPress={() => toggleSaved(book.id)}
      />

      <View style={styles.about}>
        <SectionHeading>About this book</SectionHeading>
        <Text style={styles.description}>{book.description}</Text>
      </View>

      <OutlineButton label="Check library availability" disabled note="Coming soon" />
      <OutlineButton label="Reviews & ratings" disabled note="Coming soon" style={styles.gap} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cover: {
    width: 110,
    height: 160,
  },
  summaryText: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.ink,
  },
  author: {
    fontSize: 15,
    color: Colors.muted,
  },
  meta: {
    fontSize: 15,
    color: Colors.ink,
  },
  caption: {
    fontSize: 12,
    color: Colors.muted,
  },
  about: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.ink,
  },
  gap: {
    marginTop: Spacing.md,
  },
});
