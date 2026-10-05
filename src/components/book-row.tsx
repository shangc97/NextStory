import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Book } from '@/data/books';

type Props = {
  book: Book;
  /** Third line, e.g. "Fiction · 4.6 / 5" or "Saved · Tap to view". */
  meta: string;
  onPress: () => void;
  /** Shows a small remove button on the right. */
  onRemove?: () => void;
};

/** List card used by Search results and the reading list. */
export function BookRow({ book, meta, onPress, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${book.title} by ${book.author}`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <BookCover book={book} style={styles.thumb} labelSize={7} />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {book.author}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${book.title}`}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
          <Ionicons name="close" size={20} color={Colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  thumb: {
    width: 50,
    height: 72,
    borderRadius: 6,
    padding: 3,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  author: {
    fontSize: 13,
    color: Colors.muted,
  },
  meta: {
    fontSize: 13,
    color: Colors.ink,
  },
  remove: {
    paddingHorizontal: Spacing.lg,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
