import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { LibraryProvider } from '@/store/library';

/**
 * Root navigator.
 *
 *   /            Login            (index.tsx)
 *   /signup      Create account   (signup.tsx)
 *   /discover …  Tab screens      ((tabs)/…)
 *   /book/[id]   Book details     (book/[id].tsx)
 */
export default function RootLayout() {
  return (
    <LibraryProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }} />
    </LibraryProvider>
  );
}
