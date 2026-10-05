import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text } from 'react-native';

import { PrimaryButton, Screen, ScreenTitle, TextField } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useLibrary } from '@/store/library';

/**
 * Wireframe 02 — Create account.
 *
 * Sprint 3 demo: interface only. No account is created; the name is kept on
 * the device so the Profile tab can greet the user. Firebase Authentication
 * replaces `handleCreate` in Sprint 4.
 */
export default function SignupScreen() {
  const router = useRouter();
  const { setUserName } = useLibrary();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreate = () => {
    setUserName(name.trim() || null);
    router.replace('/discover');
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

        <PrimaryButton label="Create account" onPress={handleCreate} style={styles.submit} />

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
