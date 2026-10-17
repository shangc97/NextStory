import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { auth, requireFirebase } from '@/services/firebase';

async function ensureProfile(user: User) {
  const { db } = requireFirebase();
  const ref = doc(db, 'users', user.uid);
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? '',
      preferences: { genres: [], authors: [] },
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }
}
const AuthContext = createContext<{
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const authenticating = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!auth);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (next) => { if (!authenticating.current) setUser(next); setLoading(false); });
  }, []);
  return <AuthContext.Provider value={{
    user, loading,
    login: async (email, password) => {
      const { auth } = requireFirebase();
      authenticating.current = true;
      try {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureProfile(result.user);
        setUser(result.user);
      } catch (error) {
        await signOut(auth);
        throw error;
      } finally { authenticating.current = false; }
    },
    signup: async (name, email, password) => {
      if (!name.trim() || name.trim().length > 100) throw new Error('Please enter a name of 1–100 characters.');
      const { auth } = requireFirebase();
      authenticating.current = true;
      try {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        await ensureProfile(result.user);
        setUser(result.user);
      } catch (error) {
        await signOut(auth);
        throw error;
      } finally { authenticating.current = false; }
    },
    logout: async () => { await signOut(requireFirebase().auth); },
  }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
