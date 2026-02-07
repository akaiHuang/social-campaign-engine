import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Auth, Unsubscribe } from 'firebase/auth';
import type { UserProfile } from '../types';
import { getFirebaseAuth, firebaseReady } from '../services/firebase';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const createUserProfile = (email: string, uid?: string, createdAt?: string): UserProfile => ({
  id: uid ?? `user-${Math.random().toString(36).slice(2, 10)}`,
  email,
  displayName: email.split('@')[0] || 'Creator',
  createdAt: createdAt ?? new Date().toISOString(),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);

  // 初始化 Firebase Auth（async）
  useEffect(() => {
    if (!firebaseReady) return;

    let cancelled = false;

    const initAuth = async () => {
      const authInstance = await getFirebaseAuth();
      if (!cancelled && authInstance) {
        setAuth(authInstance);
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // 監聽登入狀態變化
  useEffect(() => {
    if (!auth) return;

    let unsubscribe: Unsubscribe | undefined;

    const setupListener = async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser?.email) {
          setUser(
            createUserProfile(
              firebaseUser.email,
              firebaseUser.uid,
              firebaseUser.metadata.creationTime,
            ),
          );
        } else {
          setUser(null);
        }
      });
    };

    setupListener();

    return () => {
      unsubscribe?.();
    };
  }, [auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        if (firebaseReady && auth) {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await sleep(700);
          setUser(createUserProfile(email));
        }
      } catch (error: any) {
        console.error('SignIn Error:', error?.code, error?.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [auth],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        if (firebaseReady && auth) {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await sleep(900);
          setUser(createUserProfile(email));
        }
      } catch (error: any) {
        console.error('SignUp Error:', error?.code, error?.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    if (firebaseReady && auth) {
      await auth.signOut();
    } else {
      setUser(null);
    }
  }, [auth]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
