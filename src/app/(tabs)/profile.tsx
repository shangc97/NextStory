import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OutlineButton, PrimaryButton, Screen, ScreenTitle } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLibrary } from '@/store/library';

/**
 * Wireframe 10 — Profile (minimal version for the Sprint 3 demo).
 *
 * Shows the reader's name and activity counts. "Reset demo data" clears the
 * saved / liked / skipped lists so the deck starts from the first book again.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { userName, saved, liked, skipped, resetAll } = useLibrary();

  const stats = [
    { label: 'Saved', value: saved.length },
    { label: 'Liked', value: liked.length },
    { label: 'Skipped', value: skipped.length },
  ];

  return (
    <Screen scroll>
      <ScreenTitle subtitle="Your reading journey.">My profile</ScreenTitle>

      <View style={styles.card}>
        <Text style={styles.name}>{userName ?? 'Reader'}</Text>
        <Text style={styles.caption}>Sample profile · sign-in is not connected yet</Text>
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <OutlineButton label="Edit reading preferences" disabled note="Coming soon" />
      <OutlineButton label="Reset demo data" onPress={resetAll} style={styles.gap} />
      <PrimaryButton label="Log out" onPress={() => router.replace('/')} style={styles.gap} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.fill,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
  },
  caption: {
    fontSize: 13,
    color: Colors.muted,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  stat: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.ink,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.muted,
  },
  gap: {
    marginTop: Spacing.md,
  },
});
