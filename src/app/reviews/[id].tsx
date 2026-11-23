import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTabBar, isTabName } from '@/components/app-tab-bar';
import { EmptyState, OutlineButton, PrimaryButton, Screen, ScreenTitle, SectionHeading, TextField } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatRating } from '@/data/books';
import { averageReviewRating, MAX_REVIEW_LENGTH, validateReview } from '@/data/reviews';
import { useBookReviews } from '@/hooks/use-book-reviews';
import { reviewError, saveBookReview } from '@/services/reviews';
import { useAuth } from '@/store/auth';
import { useCatalogue } from '@/store/catalogue';

const RATINGS = [1, 2, 3, 4, 5] as const;

export default function ReviewsScreen() {
  const { id = '', from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { user } = useAuth();
  // Reset requests and drafts when switching books or signed-in readers.
  return <BookReviewsScreen key={`${user?.uid}:${id}`} bookId={id} from={from} userId={user?.uid ?? ''} />;
}

function BookReviewsScreen({ bookId, from, userId }: { bookId: string; from?: string; userId: string }) {
  const router = useRouter();
  const { getBookById, loadExternalBook } = useCatalogue();
  const book = getBookById(bookId);
  const isExternal = bookId.startsWith('google:') || bookId.startsWith('openlibrary:');
  const [externalLoading, setExternalLoading] = useState(isExternal && !book);
  const [externalError, setExternalError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const activeTab = isTabName(from) ? from : 'discover';
  const goBack = () => router.canGoBack() ? router.back() : router.replace({ pathname: '/book/[id]', params: { id: bookId } });
  const tabBar = <AppTabBar active={activeTab} onSelect={(tab) => router.navigate(`/${tab}`)} />;

  useEffect(() => {
    if (!isExternal || book) return;
    let active = true;
    void loadExternalBook(bookId).catch(() => {
      if (active) setExternalError('Unable to load this book. Check your connection and try again.');
    }).finally(() => {
      if (active) setExternalLoading(false);
    });
    return () => { active = false; };
  }, [bookId, book, isExternal, loadExternalBook, loadAttempt]);

  if (!book) {
    return (
      <Screen footer={tabBar}>
        <ScreenTitle onBack={goBack}>Reviews & ratings</ScreenTitle>
        {externalLoading ? <Text style={styles.status}>Loading book details…</Text> : (
          <EmptyState title="Book not found" body={externalError || 'This book is not in the catalogue.'}>
            {isExternal ? <OutlineButton label="Try again" onPress={() => {
              setExternalLoading(true);
              setExternalError('');
              setLoadAttempt((attempt) => attempt + 1);
            }} /> : null}
          </EmptyState>
        )}
      </Screen>
    );
  }

  return <ReviewList bookId={bookId} title={book.title} userId={userId} goBack={goBack} tabBar={tabBar} />;
}

function ReviewList({ bookId, title, userId, goBack, tabBar }: {
  bookId: string; title: string; userId: string; goBack: () => void; tabBar: React.ReactNode;
}) {
  const { reviews, loading, error, fromCache, retry } = useBookReviews(bookId);
  const ownReview = reviews.find((review) => review.userId === userId);
  const [draft, setDraft] = useState<{ rating: number | null; content: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const rating = draft ? draft.rating : ownReview?.rating ?? null;
  const text = draft ? draft.content : ownReview?.content ?? '';
  const average = averageReviewRating(reviews);
  const changed = rating !== ownReview?.rating || text.trim() !== ownReview?.content;
  const validation = validateReview(rating, text);

  const edit = (next: { rating: number | null; content: string }) => {
    setDraft(next);
    setSaveError('');
    setSaved(false);
  };
  const submit = async () => {
    if (inFlight.current) return;
    if (validation) { setSaveError(validation); return; }
    inFlight.current = true;
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await saveBookReview(bookId, rating, text);
      if (mounted.current) {
        setDraft({ rating, content: text.trim() });
        setSaved(true);
        Keyboard.dismiss();
      }
    } catch (failure) {
      if (mounted.current) setSaveError(reviewError(failure));
    } finally {
      inFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen footer={tabBar} contentStyle={styles.listContainer}>
        <FlatList
          data={reviews}
          keyExtractor={(review) => review.userId}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={(
            <>
              <ScreenTitle subtitle={title} onBack={goBack}>Reviews & ratings</ScreenTitle>
              <Text selectable style={styles.score}>
                {average != null ? formatRating(average) : loading ? 'Loading rating…' : error ? 'Rating unavailable' : 'Not rated yet'}
              </Text>
              <Text style={styles.caption}>
                Community rating · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}{fromCache ? ' · cached' : ''}
              </Text>
              <View style={styles.section}>
                <SectionHeading>Your rating</SectionHeading>
                <View style={styles.ratingRow} accessibilityRole="radiogroup" accessibilityLabel="Your rating">
                  {RATINGS.map((value) => (
                    <Pressable key={value} disabled={saving} onPress={() => edit({ rating: value === rating ? null : value, content: text })}
                      accessibilityRole="radio" accessibilityState={{ checked: value === rating, disabled: saving }}
                      accessibilityLabel={`${value} out of 5`}
                      style={({ pressed }) => [styles.ratingChip, value === rating && styles.ratingChipSelected, pressed && styles.pressed]}>
                      <Text style={[styles.ratingLabel, value === rating && styles.ratingLabelSelected]}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextField placeholder="What did you think of this book?" value={text}
                  onChangeText={(content) => edit({ rating, content })} editable={!saving}
                  multiline maxLength={MAX_REVIEW_LENGTH} autoCapitalize="sentences" autoCorrect
                  textAlignVertical="top" accessibilityLabel="Your review" style={styles.reviewInput} />
                <Text style={styles.counter}>{text.length} / {MAX_REVIEW_LENGTH}</Text>
                <PrimaryButton label={saving ? 'Saving review…' : ownReview ? 'Update review' : 'Post review'}
                  onPress={submit} disabled={!userId || saving || loading || !!error || !!validation || !changed} />
                <Text style={styles.note}>{saving
                  ? 'Waiting for confirmation. Keep this page open; your draft is preserved.'
                  : 'Choose 1–5 and write a review. One review per reader per book; you can update it later.'}</Text>
                {saveError ? <Text selectable style={styles.note} accessibilityRole="alert">{saveError} Your draft has been kept.</Text> : null}
                {saved ? <Text style={styles.note} accessibilityLiveRegion="polite">Your review was saved.</Text> : null}
              </View>
              <SectionHeading>Reader reviews</SectionHeading>
              {fromCache ? <Text style={styles.note}>Showing cached reviews while reconnecting.</Text> : null}
              {error ? <View style={styles.readError}>
                <Text selectable accessibilityRole="alert" style={styles.note}>{error}</Text>
                <OutlineButton label="Retry loading reviews" onPress={retry} />
              </View> : null}
              {loading ? <Text style={styles.status} accessibilityLiveRegion="polite">Loading reviews…</Text> : null}
            </>
          )}
          ListEmptyComponent={!loading && !error ? <EmptyState title="No reviews yet" body="Be the first to share what you thought of this book." /> : undefined}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewHeader}>{item.userId === userId ? 'You' : 'Reader'} · {item.rating} / 5</Text>
              <Text selectable style={styles.reviewText}>{item.content}</Text>
              {item.updatedAt != null ? <Text style={styles.reviewDate}>Updated {new Date(item.updatedAt).toLocaleDateString()}</Text> : null}
            </View>
          )}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 0 },
  listContent: { paddingBottom: Spacing.xxl },
  counter: { fontSize: 12, color: Colors.muted, marginBottom: Spacing.md, textAlign: 'right' },
  readError: { gap: Spacing.sm, marginBottom: Spacing.md },
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

  reviewDate: {
    fontSize: 12,
    color: Colors.muted,
  },

  pressed: {
    opacity: 0.7,
  },
});
