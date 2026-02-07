/**
 * Video processing utilities
 *
 * Placeholder for ffmpeg-based or expo-av-based processing.
 */

// ────────────────────────────────────────
// Crop to 9:16 aspect ratio
// ────────────────────────────────────────
export const cropTo916 = async (_inputUri: string): Promise<string> => {
  // In a real implementation, use ffmpeg-kit-react-native or similar
  // to crop the video to 9:16 for IG Stories.
  return _inputUri; // passthrough for now
};

// ────────────────────────────────────────
// Add text overlay / watermark
// ────────────────────────────────────────
export const addWatermark = async (
  _inputUri: string,
  _text: string,
): Promise<string> => {
  // Use ffmpeg drawtext filter or image overlay
  return _inputUri;
};

// ────────────────────────────────────────
// Generate thumbnail from video
// ────────────────────────────────────────
export const generateThumbnail = async (
  _inputUri: string,
  _timeSec = 0,
): Promise<string> => {
  // Use expo-video-thumbnails or ffmpeg to extract a frame
  return 'https://example.com/placeholder-thumb.jpg';
};
