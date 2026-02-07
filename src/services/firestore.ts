import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseApp, firebaseReady } from './firebase';
import type { CreditPack, VideoItem } from '../types';

export const db = firebaseReady && firebaseApp ? getFirestore(firebaseApp) : null;

// ────────────────────────────────────────
// User Profile
// ────────────────────────────────────────
export interface FirestoreUserProfile {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export const getUserProfile = async (uid: string): Promise<FirestoreUserProfile | null> => {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as FirestoreUserProfile) : null;
};

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
  initialCredits = 100,
): Promise<FirestoreUserProfile> => {
  if (!db) throw new Error('Firestore not initialized');
  const now = new Date().toISOString();
  const profile: FirestoreUserProfile = {
    uid,
    email,
    displayName,
    credits: initialCredits,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'users', uid), profile);
  return profile;
};

export const updateUserCredits = async (uid: string, credits: number): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), { credits, updatedAt: new Date().toISOString() });
};

// ────────────────────────────────────────
// Videos
// ────────────────────────────────────────
export const saveVideo = async (uid: string, video: VideoItem): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'videos', video.id), video);
};

export const updateVideoStatus = async (
  uid: string,
  videoId: string,
  status: VideoItem['status'],
  errorMessage?: string,
): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid, 'videos', videoId), {
    status,
    ...(errorMessage ? { errorMessage } : {}),
  });
};

export const getUserVideos = async (uid: string): Promise<VideoItem[]> => {
  if (!db) return [];
  const q = query(
    collection(db, 'users', uid, 'videos'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as VideoItem);
};

// ────────────────────────────────────────
// Purchases (for audit trail)
// ────────────────────────────────────────
export interface PurchaseRecord {
  id: string;
  uid: string;
  pack: CreditPack;
  platform: 'ios' | 'android' | 'web' | 'mock';
  receipt?: string;
  createdAt: string;
}

export const recordPurchase = async (uid: string, record: PurchaseRecord): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'purchases', record.id), record);
};
