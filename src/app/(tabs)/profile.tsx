import { useState } from 'react';
import { useAuth } from '@/store/auth';
import { firebaseError } from '@/services/firebase';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { OutlineButton, PrimaryButton, Screen, ScreenTitle } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLibrary } from '@/store/library';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const handleLogout = async () => {
    setBusy(true);
    try { await logout(); } catch (error) { setError(firebaseError(error)); }
    finally { setBusy(false); }
  };
  const { userName, saved, liked, skipped, resetAll, error: syncError, hydrated } = useLibrary();

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
        <Text style={styles.caption}>{user?.email}</Text>
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
      <OutlineButton label="Clear reading activity" disabled={!hydrated} onPress={() => Alert.alert('Clear reading activity?', 'Your saved books and swipes will be deleted.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: resetAll }])} style={styles.gap} />
      <Text accessibilityRole="alert">{error || syncError}</Text>
      <PrimaryButton label="Log out" disabled={busy} onPress={handleLogout} style={styles.gap} />
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
