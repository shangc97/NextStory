import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, Screen, TextField } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';

/**
 * Wireframe 01 — Login.
 *
 * Sprint 3 demo: this is the interface only. "Log in" goes straight into the
 * app without checking the fields. Firebase Authentication replaces
 * `handleLogin` in Sprint 4.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.replace('/discover');
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll>
        <Text style={styles.brand}>NextStory</Text>
        <Text style={styles.tagline}>Your next great read starts here.</Text>

        <Text style={styles.heading}>Welcome back</Text>

        <TextField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        <Text style={styles.forgot}>Forgot password?</Text>

        <PrimaryButton label="Log in" onPress={handleLogin} />

        <Pressable
          onPress={() => router.push('/signup')}
          hitSlop={8}
          accessibilityRole="link"
          style={styles.switchLink}>
          <Text style={styles.switchText}>New to NextStory? Create an account</Text>
        </Pressable>

        <View style={styles.promo}>
          <Text style={styles.promoTitle}>Find books that fit your taste.</Text>
          <Text style={styles.promoBody}>Swipe. Save. Read.</Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  brand: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Colors.ink,
  },
  tagline: {
    marginTop: Spacing.xs,
    fontSize: 14,
    color: Colors.muted,
  },
  heading: {
    marginTop: 44,
    marginBottom: Spacing.xl,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: Colors.ink,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
    fontSize: 13,
    color: Colors.ink,
  },
  switchLink: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
  },
  switchText: {
    fontSize: 15,
    color: Colors.ink,
  },
  promo: {
    marginTop: 56,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.fill,
    gap: 4,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  promoBody: {
    fontSize: 14,
    color: Colors.ink,
  },
});
