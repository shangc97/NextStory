import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/constants/theme';

export const TABS = [
  { name: 'discover', label: 'Discover' },
  { name: 'search', label: 'Search' },
  { name: 'saved', label: 'Saved' },
  { name: 'profile', label: 'Profile' },
] as const;

export type TabName = (typeof TABS)[number]['name'];

export function isTabName(value: unknown): value is TabName {
  return TABS.some((tab) => tab.name === value);
}

type Props = {
  active: TabName;
  onSelect: (tab: TabName) => void;
};

/** Text-only tab bar from the wireframes: the active tab gets a grey pill. */
export function AppTabBar({ active, onSelect }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const selected = tab.name === active;
        return (
          <Pressable
            key={tab.name}
            onPress={() => onSelect(tab.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.tab, selected && styles.tabActive]}>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tab: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.fill,
  },
  label: {
    fontSize: 13,
    color: Colors.muted,
  },
  labelActive: {
    fontWeight: '700',
    color: Colors.ink,
  },
});
