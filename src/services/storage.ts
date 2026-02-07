import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firebaseApp, firebaseReady } from './firebase';

export const storage = firebaseReady && firebaseApp ? getStorage(firebaseApp) : null;

/**
 * Upload a video blob and return the download URL.
 */
export const uploadVideo = async (
  uid: string,
  videoId: string,
  blob: Blob,
): Promise<string | null> => {
  if (!storage) return null;
  const path = `users/${uid}/videos/${videoId}.mp4`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

/**
 * Upload a thumbnail image and return the download URL.
 */
export const uploadThumbnail = async (
  uid: string,
  videoId: string,
  blob: Blob,
): Promise<string | null> => {
  if (!storage) return null;
  const path = `users/${uid}/thumbnails/${videoId}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};
