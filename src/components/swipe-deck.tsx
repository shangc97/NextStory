import { Ionicons } from '@expo/vector-icons';
import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BookCover } from '@/components/book-cover';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { Book, formatRating } from '@/data/books';

/**
 * The swipe deck from wireframe "04 Main screen" and the "Swipe Interaction
 * Prototype" frames: READY -> SWIPE LEFT or SWIPE RIGHT -> NEXT BOOK -> REPEAT.
 *
 * Built with React Native's own Animated + PanResponder, so it needs no extra
 * native libraries and runs in Expo Go, on Android, iOS and the web.
 */

export type SwipeDirection = 'left' | 'right';

type CardHandle = { swipe: (direction: SwipeDirection) => void };

/** How much of the next card peeks out below the top card. */
const PEEK = 14;
const NEXT_CARD_SCALE = 0.94;

type DeckProps = {
  /** Books still to show. The first one is the top card. */
  books: Book[];
  savedIds: string[];
  onLike: (book: Book) => void;
  onSkip: (book: Book) => void;
  onToggleSave: (book: Book) => void;
  onOpen: (book: Book) => void;
};

export function SwipeDeck({ books, savedIds, onLike, onSkip, onToggleSave, onOpen }: DeckProps) {
  // 0 = next card tucked under the top card, 1 = next card fully revealed.
  const [reveal] = useState(() => new Animated.Value(0));
  const [deckHeight, setDeckHeight] = useState(0);
  const topCard = useRef<CardHandle>(null);

  const top = books[0];
  const topId = top?.id;
  const topIsSaved = top ? savedIds.includes(top.id) : false;

  useEffect(() => {
    // A new card reached the top: tuck the following one back underneath.
    Animated.spring(reveal, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
  }, [topId, reveal]);

  // Render the next card first so the top card is drawn above it.
  const visible = books.slice(0, 2).reverse();

  return (
    <View style={styles.deck}>
      <View style={styles.cards} onLayout={(event) => setDeckHeight(event.nativeEvent.layout.height)}>
        {visible.map((book) => {
          const isTop = book.id === topId;
          return (
            <SwipeCard
              key={book.id}
              ref={isTop ? topCard : undefined}
              book={book}
              isTop={isTop}
              reveal={reveal}
              deckHeight={deckHeight}
              onPress={() => onOpen(book)}
              onSwiped={(direction) => (direction === 'right' ? onLike(book) : onSkip(book))}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <ActionButton label="Skip" icon="close" onPress={() => topCard.current?.swipe('left')} />
        <ActionButton
          label={topIsSaved ? 'Saved' : 'Save'}
          icon={topIsSaved ? 'bookmark' : 'bookmark-outline'}
          onPress={() => top && onToggleSave(top)}
        />
        <ActionButton label="Like" icon="heart" onPress={() => topCard.current?.swipe('right')} />
      </View>
    </View>
  );
}

type CardProps = {
  book: Book;
  isTop: boolean;
  reveal: Animated.Value;
  deckHeight: number;
  onPress: () => void;
  onSwiped: (direction: SwipeDirection) => void;
  ref?: Ref<CardHandle>;
};

function SwipeCard({ book, isTop, reveal, deckHeight, onPress, onSwiped, ref }: CardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, MaxContentWidth);
  /** Drag distance after which releasing the card counts as a swipe. */
  const threshold = width * 0.25;

  const [pan] = useState(() => new Animated.ValueXY());
  const leaving = useRef(false);
  const lastDragEnd = useRef(0);

  const flyOut = (direction: SwipeDirection) => {
    if (leaving.current) return;
    leaving.current = true;
    const x = direction === 'right' ? width * 1.4 : -width * 1.4;
    Animated.parallel([
      Animated.timing(pan, { toValue: { x, y: 30 }, duration: 240, useNativeDriver: false }),
      Animated.timing(reveal, { toValue: 1, duration: 240, useNativeDriver: false }),
    ]).start(() => onSwiped(direction));
  };

  const settle = () => {
    Animated.parallel([
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, bounciness: 8 }),
      Animated.spring(reveal, { toValue: 0, useNativeDriver: false, bounciness: 4 }),
    ]).start();
  };

  useImperativeHandle(ref, () => ({ swipe: flyOut }));

  const handlePress = () => {
    // On the web a mouse drag ends with a click event; do not treat that as a tap.
    if (leaving.current || Date.now() - lastDragEnd.current < 300) return;
    onPress();
  };

  // The gesture handlers are created once, so they read the latest props through this ref.
  const latest = useRef({ isTop, threshold, flyOut, settle });
  useEffect(() => {
    latest.current = { isTop, threshold, flyOut, settle };
  });

  // PanResponder stores these callbacks; ref reads happen only during gestures.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      // Only take over for a clearly horizontal drag, so a tap still opens the details.
      onMoveShouldSetPanResponder: (_, gesture) =>
        latest.current.isTop &&
        !leaving.current &&
        Math.abs(gesture.dx) > 8 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
        reveal.setValue(Math.min(1, Math.abs(gesture.dx) / (latest.current.threshold * 1.5)));
      },
      onPanResponderRelease: (_, gesture) => {
        lastDragEnd.current = Date.now();
        const { threshold: limit } = latest.current;
        if (gesture.dx > limit || gesture.vx > 0.8) latest.current.flyOut('right');
        else if (gesture.dx < -limit || gesture.vx < -0.8) latest.current.flyOut('left');
        else latest.current.settle();
      },
      onPanResponderTerminate: () => {
        lastDragEnd.current = Date.now();
        latest.current.settle();
      },
    }),
  );

  const rotate = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = pan.x.interpolate({
    inputRange: [-threshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // The next card sits slightly smaller and lower, so only its bottom edge shows.
  const cardHeight = Math.max(deckHeight - PEEK, 0);
  const restingOffset = PEEK + (cardHeight * (1 - NEXT_CARD_SCALE)) / 2;
  const transform = isTop
    ? [{ translateX: pan.x }, { translateY: pan.y }, { rotate }]
    : [
        { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [restingOffset, 0] }) },
        { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [NEXT_CARD_SCALE, 1] }) },
      ];

  return (
    <Animated.View
      style={[styles.card, { transform }]}
      {...panResponder.panHandlers}
      accessibilityElementsHidden={!isTop}
      importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}>
      <Pressable
        onPress={handlePress}
        disabled={!isTop}
        accessibilityRole="button"
        accessibilityLabel={`${book.title} by ${book.author}. Tap for details.`}
        style={styles.cardBody}>
        <View style={styles.coverWrap}>
          <BookCover book={book} fit="contain" labelSize={15} style={styles.cover} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.byline} numberOfLines={1}>
          {book.author} · {book.genre}
        </Text>
        <Text style={styles.rating}>{book.rating > 0 ? formatRating(book.rating) : 'Not rated'}</Text>
        <Text style={styles.hook} numberOfLines={2}>
          {book.hook}
        </Text>
        <Text style={styles.tapHint}>Tap card for details</Text>
      </Pressable>

      {isTop ? (
        <>
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampSkip, { opacity: skipOpacity }]}>
            <Text style={styles.stampText}>SKIP</Text>
          </Animated.View>
        </>
      ) : (
        // Grey slab from the wireframe; fades away as the top card is dragged aside.
        <Animated.View
          style={[
            styles.nextCardCover,
            { opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
          ]}
        />
      )}
    </Animated.View>
  );
}

type ActionButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function ActionButton({ label, icon, onPress }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.actionCircle}>
        <Ionicons name={icon} size={28} color={Colors.ink} />
      </View>
      <Text style={styles.actionLabel}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
  },
  cards: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: PEEK,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    userSelect: 'none',
  },
  cardBody: {
    flex: 1,
    padding: Spacing.lg,
  },
  coverWrap: {
    flex: 1,
    minHeight: 80,
    marginBottom: Spacing.md,
    // Keeps the browser from starting an image drag instead of a swipe on the web.
    pointerEvents: 'none',
  },
  cover: {
    flex: 1,
    borderRadius: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: Colors.ink,
  },
  byline: {
    marginTop: 4,
    fontSize: 15,
    color: Colors.muted,
  },
  rating: {
    marginTop: Spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  hook: {
    marginTop: Spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
  },
  tapHint: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  stampLike: {
    left: 28,
    transform: [{ rotate: '-8deg' }],
  },
  stampSkip: {
    right: 28,
    transform: [{ rotate: '8deg' }],
  },
  stampText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.ink,
  },
  nextCardCover: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#E2E2E2',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 44,
    paddingTop: Spacing.md,
  },
  action: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.ink,
  },
  pressed: {
    opacity: 0.6,
  },
});
