import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { LibraryProvider } from '@/store/library';
import { AuthProvider, useAuth } from '@/store/auth';
import { ActivityIndicator, View } from 'react-native';

/**
 * Root navigator.
 *
 *   /            Login            (index.tsx)
 *   /signup      Create account   (signup.tsx)
 *   /discover …  Tab screens      ((tabs)/…)
 *   /book/[id]   Book details     (book/[id].tsx)
 */
function Navigator() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  return (
    <LibraryProvider key={user?.uid ?? 'signed-out'}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="book/[id]" />
        </Stack.Protected>
      </Stack>
    </LibraryProvider>
  );
}
export default function RootLayout() {
  return <AuthProvider><Navigator /></AuthProvider>;
}
