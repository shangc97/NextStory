import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text } from 'react-native';

import { PrimaryButton, Screen, ScreenTitle, TextField } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { firebaseConfigured, firebaseError } from '@/services/firebase';
import { Colors, Spacing } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleCreate = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await signup(name, email, password); }
    catch (error) { setError(firebaseError(error)); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll>
        <ScreenTitle subtitle="Start building your reading profile." onBack={() => router.back()}>
          Create account
        </ScreenTitle>

        <TextField
          label="Name"
          placeholder="Your name"
          autoCapitalize="words"
          textContentType="name"
          value={name}
          onChangeText={setName}
        />
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
          placeholder="Create a password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleCreate}
        />

        <Text accessibilityRole="alert">{error || (!firebaseConfigured ? 'Account service is not configured yet.' : '')}</Text>
        <PrimaryButton disabled={busy || !firebaseConfigured} label={busy ? 'Please wait…' : 'Create account'} onPress={handleCreate} style={styles.submit} />

        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="link" style={styles.switchLink}>
          <Text style={styles.switchText}>Already have an account? Log in</Text>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  submit: {
    marginTop: Spacing.lg,
  },
  switchLink: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
  },
  switchText: {
    fontSize: 15,
    color: Colors.ink,
  },
});
