import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { Book, coverUrl } from '@/data/books';

type Props = {
  book: Book;
  style?: StyleProp<ViewStyle>;
  /** 'cover' crops to fill the box (thumbnails); 'contain' shows the whole cover (swipe card). */
  fit?: 'cover' | 'contain';
  /** Font size of the title shown on the placeholder. */
  labelSize?: number;
};

/**
 * Book cover with a built-in fallback. The grey placeholder with the title is
 * what the wireframes show; the real cover is drawn on top once it has loaded.
 * If the image cannot be loaded (no network, missing cover), the placeholder
 * simply stays, so the screen never shows a blank box.
 */
export function BookCover({ book, style, fit = 'cover', labelSize = 12 }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const uri = coverUrl(book, fit === 'contain' ? 'L' : 'M');
  const showImage = uri !== null && status !== 'failed';

  return (
    <View style={[styles.box, style]}>
      {status !== 'loaded' ? (
        <Text style={[styles.label, { fontSize: labelSize, lineHeight: labelSize * 1.5 }]} numberOfLines={4}>
          {book.title.toUpperCase()}
        </Text>
      ) : null}
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={fit}
          transition={150}
          accessibilityLabel={`Cover of ${book.title}`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.placeholder,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  label: {
    fontWeight: '700',
    color: Colors.borderStrong,
    textAlign: 'center',
  },
});
