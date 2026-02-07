export { firebaseApp, firebaseAuth, firebaseConfig, firebaseReady } from './firebase';
export { db, getUserProfile, createUserProfile, updateUserCredits, saveVideo, updateVideoStatus as updateVideoStatusFirestore, getUserVideos, recordPurchase } from './firestore';
export { storage, uploadVideo, uploadThumbnail } from './storage';
export { openaiReady, submitGenerationJob, pollJobStatus, waitForCompletion } from './openai';
export { instagramReady, shareToInstagramStory, createMediaContainer, publishMedia } from './instagram';
export { iapReady, purchaseCreditPack, verifyPurchase } from './iap';
export { cropTo916, addWatermark, generateThumbnail } from './videoProcessing';
export { estimateCredits, buildMockVideo, updateVideoStatus } from './videoGeneration';
export { 
  isBackgroundUploadAvailable, 
  downloadToLocal, 
  startBackgroundUpload, 
  cancelUpload, 
  cleanupTempFiles 
} from './backgroundUpload';
