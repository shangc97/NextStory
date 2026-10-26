
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppTabBar, isTabName } from '@/components/app-tab-bar';
import {
  EmptyState,
  PrimaryButton,
  Screen,
  ScreenTitle,
  SectionHeading,
  TextField,
} from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatRating } from '@/data/books';
import { useCatalogue } from '@/store/catalogue';

/**
 * Wireframe 08 — Reviews & ratings.
 *
 * Supports both Firebase catalogue books and Google Books.
 *
 * Review posting is not implemented yet. Users can select
 * a rating and write a review, but the Post review button
 * remains disabled.
 *
 * Reader reviews displayed below are sample data.
 */

const RATINGS = [1, 2, 3, 4, 5] as const;

const SAMPLE_REVIEWS = [
  {
    id: 'sample-1',
    name: 'Alex',
    rating: 5,
    text: "Couldn't put it down. I finished it in two evenings.",
  },
  {
    id: 'sample-2',
    name: 'Sam',
    rating: 4,
    text: 'A slow start, but the second half really pays off.',
  },
];

export default function ReviewsScreen() {
  const router = useRouter();

  const { getBookById, loadExternalBook } = useCatalogue();

  const { id, from } = useLocalSearchParams<{
    id: string;
    from?: string;
  }>();

  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState('');

  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');

  const book = getBookById(id);

  const activeTab = isTabName(from) ? from : 'discover';

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({
          pathname: '/book/[id]',
          params: { id },
        });

  const tabBar = (
    <AppTabBar
      active={activeTab}
      onSelect={(tab) => router.navigate(`/${tab}`)}
    />
  );

  /**
   * Load a Google Books volume if it isn't already
   * available in the shared catalogue cache.
   *
   * Existing Firebase books are not affected.
   */
  useEffect(() => {
    if (!id || (!id.startsWith('google:') && !id.startsWith('openlibrary:')) || book) {
      setExternalLoading(false);
      return;
    }

    let active = true;

    setExternalLoading(true);
    setExternalError('');

    loadExternalBook(id)
      .catch(() => {
        if (active) {
          setExternalError(
            'Unable to load this book. Check your connection and try again.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setExternalLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, book, loadExternalBook]);

  /**
   * Loading state for external books.
   */
  if (!book && externalLoading) {
    return (
      <Screen footer={tabBar}>
        <ScreenTitle onBack={goBack}>
          Reviews & ratings
        </ScreenTitle>

        <Text style={styles.status}>
          Loading book details…
        </Text>
      </Screen>
    );
  }

  /**
   * Missing book or API error.
   */
  if (!book) {
    return (
      <Screen footer={tabBar}>
        <ScreenTitle onBack={goBack}>
          Reviews & ratings
        </ScreenTitle>

        <EmptyState
          title="Book not found"
          body={
            externalError ||
            'This book is not in the catalogue.'
          }
        />
      </Screen>
    );
  }

  const hasRating = book.rating > 0;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll footer={tabBar}>
        <ScreenTitle
          subtitle={book.title}
          onBack={goBack}
        >
          Reviews & ratings
        </ScreenTitle>

        {/* Book rating */}
        <Text style={styles.score}>
          {hasRating
            ? formatRating(book.rating)
            : 'Not rated'}
        </Text>

        <Text style={styles.caption}>
          {book.source === 'google'
            ? 'Google Books rating, when available'
            : 'Community rating · sample data'}
        </Text>

        {/* User rating */}
        <View style={styles.section}>
          <SectionHeading>Your rating</SectionHeading>

          <View
            style={styles.ratingRow}
            accessibilityRole="radiogroup"
            accessibilityLabel="Your rating"
          >
            {RATINGS.map((value) => {
              const selected = value === rating;

              return (
                <Pressable
                  key={value}
                  onPress={() =>
                    setRating(selected ? null : value)
                  }
                  role="radio"
                  aria-checked={selected}
                  accessibilityLabel={`${value} out of 5`}
                  style={({ pressed }) => [
                    styles.ratingChip,
                    selected && styles.ratingChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingLabel,
                      selected && styles.ratingLabelSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Review text input */}
          <TextField
            placeholder="What did you think of this book?"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            autoCapitalize="sentences"
            autoCorrect
            textAlignVertical="top"
            accessibilityLabel="Your review"
            style={styles.reviewInput}
          />

          <PrimaryButton
            label="Post review"
            disabled
          />

          <Text style={styles.note}>
            Posting reviews is coming in a later sprint.
          </Text>
        </View>

        {/* Sample reviews */}
        <SectionHeading>Reader reviews</SectionHeading>

        {SAMPLE_REVIEWS.map((review) => (
          <View
            key={review.id}
            style={styles.reviewCard}
          >
            <Text style={styles.reviewHeader}>
              {review.name} · {review.rating} / 5
            </Text>

            <Text style={styles.reviewText}>
              {review.text}
            </Text>

            <Text style={styles.sampleTag}>
              Sample review
            </Text>
          </View>
        ))}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  status: {
    marginTop: Spacing.lg,
    fontSize: 15,
    color: Colors.muted,
  },

  score: {
    marginTop: -Spacing.sm,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: Colors.ink,
  },

  caption: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.muted,
  },

  section: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  ratingChip: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ratingChipSelected: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },

  ratingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.ink,
  },

  ratingLabelSelected: {
    color: Colors.onInk,
  },

  reviewInput: {
    height: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },

  note: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.muted,
  },

  reviewCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 6,
  },

  reviewHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },

  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ink,
  },

  sampleTag: {
    fontSize: 12,
    color: Colors.muted,
  },

  pressed: {
    opacity: 0.7,
  },
});
