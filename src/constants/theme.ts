/**
 * Design tokens taken from the NextStory low-fidelity wireframes (Figma).
 * The wireframes are black-and-white on purpose; when the high-fidelity
 * design is ready, change the values here and every screen follows.
 */

export const Colors = {
  /** Screen background */
  background: '#FAFAFA',
  /** Cards, inputs, tab bar */
  surface: '#FFFFFF',
  /** Primary text and filled buttons */
  ink: '#1E1E1E',
  /** Secondary text, labels, placeholders */
  muted: '#757575',
  /** Hairlines around inputs and list cards */
  border: '#D4D4D4',
  /** Stronger outline used on the swipe card and outlined buttons */
  borderStrong: '#4A4A4A',
  /** Grey blocks: info box, active tab pill, chips */
  fill: '#EEEEEE',
  /** Cover placeholder */
  placeholder: '#E6E6E6',
  onInk: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** Horizontal padding shared by every screen. */
export const ScreenPadding = 24;

/** Wide layouts (web, tablets) keep the phone-sized column from the wireframes. */
export const MaxContentWidth = 480;
