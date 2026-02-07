import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

const requiredFirebaseKeys = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

export const firebaseReady = Object.values(requiredFirebaseKeys).every(Boolean);

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;

// 延遲初始化 Firebase App
export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseReady) return null;

  if (!firebaseAppInstance) {
    firebaseAppInstance =
      getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return firebaseAppInstance;
}

// 延遲初始化 Firebase Auth（搭配 AsyncStorage 持久化）
// 必須完全延遲載入，避免在 runtime 準備好之前 import
export async function getFirebaseAuth(): Promise<Auth | null> {
  if (!firebaseReady) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  if (!firebaseAuthInstance) {
    // 動態載入 auth 模組，確保 runtime 已準備好
    const { initializeAuth, getReactNativePersistence, getAuth } = await import(
      'firebase/auth'
    );
    const ReactNativeAsyncStorage = (
      await import('@react-native-async-storage/async-storage')
    ).default;

    try {
      // 嘗試使用 initializeAuth（首次初始化）
      firebaseAuthInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch {
      // 如果已經初始化過（例如 hot reload），使用 getAuth
      firebaseAuthInstance = getAuth(app);
    }
  }
  return firebaseAuthInstance;
}
