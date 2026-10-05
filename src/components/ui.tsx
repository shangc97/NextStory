import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, ScreenPadding, Spacing } from '@/constants/theme';

/** Shared building blocks that match the wireframe components. */

type ScreenProps = {
  children: ReactNode;
  /** Wrap the content in a ScrollView (forms, long pages). */
  scroll?: boolean;
  /** Rendered below the content, edge to edge (used for the tab bar). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = false, footer, contentStyle }: ScreenProps) {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.column}>
          {scroll ? (
            <ScrollView
              contentContainerStyle={[styles.content, styles.scrollContent, contentStyle]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
          )}
          {footer}
        </View>
      </SafeAreaView>
    </View>
  );
}

type TitleProps = {
  children: string;
  subtitle?: string;
  /** Shows the "<" from the wireframes and makes the title a back button. */
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenTitle({ children, subtitle, onBack, right }: TitleProps) {
  const title = (
    <Text style={styles.title} numberOfLines={1}>
      {onBack ? `< ${children}` : children}
    </Text>
  );
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.fill}>
            {title}
          </Pressable>
        ) : (
          <View style={styles.fill}>{title}</View>
        )}
        {right}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeading({ children }: { children: string }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Small note on the right side, e.g. "Coming soon". */
  note?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[styles.buttonLabel, styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, disabled, note, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        styles.outlineButton,
        pressed && styles.pressed,
        disabled && styles.outlineDisabled,
        style,
      ]}>
      <Text style={[styles.buttonLabel, disabled && styles.mutedLabel]}>{label}</Text>
      {note ? <Text style={styles.buttonNote}>{note}</Text> : null}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label?: string };

export function TextField({ label, style, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
        style={[styles.input, style]}
      />
    </View>
  );
}

type OptionBarProps<T extends string> = {
  options: readonly T[];
  selected: T | null;
  onSelect: (option: T) => void;
};

/** The grey bar with text options from the wireframes (genres, Saved / Liked / Read). */
export function OptionBar<T extends string>({ options, selected, onSelect }: OptionBarProps<T>) {
  return (
    <View style={styles.optionBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.option, active && styles.optionActive]}>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  titleBlock: {
    marginBottom: Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Colors.ink,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
  },
  sectionHeading: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: Spacing.md,
  },
  button: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: Colors.ink,
  },
  outlineButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  outlineDisabled: {
    borderColor: Colors.border,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  primaryLabel: {
    color: Colors.onInk,
  },
  mutedLabel: {
    color: Colors.muted,
  },
  buttonNote: {
    fontSize: 12,
    color: Colors.muted,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.ink,
  },
  optionBar: {
    backgroundColor: Colors.fill,
    borderRadius: Radius.md,
  },
  optionRow: {
    padding: 6,
    gap: 2,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  optionActive: {
    backgroundColor: Colors.surface,
  },
  optionLabel: {
    fontSize: 15,
    color: Colors.ink,
  },
  optionLabelActive: {
    fontWeight: '700',
  },
  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
    textAlign: 'center',
  },
});
