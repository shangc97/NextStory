import { useCatalogue } from "@/store/catalogue";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { AppTabBar, isTabName } from "@/components/app-tab-bar";
import { BookCover } from "@/components/book-cover";
import {
  EmptyState,
  OutlineButton,
  PrimaryButton,
  Screen,
  ScreenTitle,
  SectionHeading,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { formatRating } from "@/data/books";
import { useLibrary } from "@/store/library";

/**
 * Wireframe 06 — Book details.
 *
 * Opened from Discover, Search or the reading list; `from` remembers which tab
 * to highlight. Reviews & ratings opens wireframe 08; library availability is
 * shown as in the wireframe but stays disabled until its sprint.
 */
export default function BookDetailsScreen() {
  const router = useRouter();
  const { getBookById, loadExternalBook } = useCatalogue();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { saved, toggleSaved } = useLibrary();

  const book = getBookById(id);

  const [externalLoading, setExternalLoading] = useState(
    id?.startsWith("google:") ?? false,
  );
  const [externalError, setExternalError] = useState("");

  useEffect(() => {
    if (!id || (!id.startsWith('google:') && !id.startsWith('openlibrary:')) || book) {
      setExternalLoading(false);
      return;
    }

    let active = true;
    setExternalLoading(true);
    setExternalError("");

    loadExternalBook(id)
      .catch(() => {
        if (active) {
          setExternalError("Unable to load this book.");
        }
      })
      .finally(() => {
        if (active) setExternalLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, book, loadExternalBook]);

  const activeTab = isTabName(from) ? from : "discover";
  const isSaved = book ? saved.includes(book.id) : false;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/discover");

  const tabBar = (
    <AppTabBar
      active={activeTab}
      onSelect={(tab) => router.navigate(`/${tab}`)}
    />
  );

  if (!book) {
    return (
      <Screen footer={tabBar}>
        <ScreenTitle onBack={goBack}>Book details</ScreenTitle>
          {externalLoading ? (
            <Text>Loading book details…</Text>
          ) : (
            <EmptyState
              title="Book not found"
              body={externalError || "This book is not in the catalogue."}
            />
          )}
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
            {book.genre} ·{' '}
            {book.rating > 0
              ? formatRating(book.rating)
              : 'Not rated'}
          </Text>
          <Text style={styles.caption}>
            {book.year > 0 ? `Published ${book.year}` : 'Year unavailable'}
            {' · '}
            {book.source === 'google'
              ? 'Google Books'
              : 'Sample catalogue'}
          </Text>
        </View>
      </View>

      <PrimaryButton
        label={
          isSaved ? "Saved to my reading list ✓" : "Save to my reading list"
        }
        onPress={() => toggleSaved(book.id)}
      />

      <View style={styles.about}>
        <SectionHeading>About this book</SectionHeading>
        <Text style={styles.description}>{book.description}</Text>
      </View>

      <OutlineButton
        label="Check library availability"
        disabled
        note="Coming soon"
      />
      <OutlineButton
        label="Reviews & ratings"
        onPress={() =>
          router.push({
            pathname: "/reviews/[id]",
            params: { id: book.id, from: activeTab },
          })
        }
        style={styles.gap}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cover: {
    width: 110,
    height: 160,
  },
  summaryText: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
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
