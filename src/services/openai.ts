/**
 * OpenAI / Sora2 Video Generation API Client
 *
 * This module wraps requests to the video generation endpoint.
 * When EXPO_PUBLIC_OPENAI_API_KEY is missing, it falls back to mock mode.
 */

import type { GenerationRequest, VideoItem } from '../types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export const openaiReady = Boolean(OPENAI_API_KEY);

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────
export interface GenerationJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  progress?: number;
}

// Map quality setting to Sora size (9:16 for IG Stories)
const getSoraSize = (quality: string): string => {
  // 720x1280 = standard, 1080x1920 = high (use 1024x1792 as closest)
  return quality === 'high' ? '1024x1792' : '720x1280';
};

// ────────────────────────────────────────
// Submit generation task
// ────────────────────────────────────────
export const submitGenerationJob = async (
  request: GenerationRequest,
): Promise<GenerationJobResponse> => {
  if (!openaiReady) {
    // Mock mode
    return {
      jobId: `mock-${Date.now()}`,
      status: 'queued',
    };
  }

  // Build prompt with theme, style, camera
  const fullPrompt = [
    request.prompt,
    `主題風格：${request.theme}`,
    `視覺風格：${request.style}`,
    `鏡頭運動：${request.camera}`,
  ].join('。');

  // Sora API uses FormData
  const formData = new FormData();
  formData.append('model', 'sora-2');
  formData.append('prompt', fullPrompt);
  formData.append('size', getSoraSize(request.quality));
  formData.append('seconds', '8'); // 8 秒影片適合 IG Stories

  const res = await fetch('https://api.openai.com/v1/videos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`生成請求失敗：${text}`);
  }

  const data = await res.json();
  return {
    jobId: data.id,
    status: data.status ?? 'queued',
    progress: data.progress ?? 0,
  };
};

// ────────────────────────────────────────
// Poll job status
// ────────────────────────────────────────
export const pollJobStatus = async (jobId: string): Promise<GenerationJobResponse> => {
  if (!openaiReady || jobId.startsWith('mock-')) {
    // Mock: randomly complete after short delay
    await new Promise((r) => setTimeout(r, 800));
    const failed = Math.random() < 0.1;
    // 使用 Google 提供的公開測試影片（真實可下載）
    const mockVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    ];
    const randomVideo = mockVideos[Math.floor(Math.random() * mockVideos.length)];
    return {
      jobId,
      status: failed ? 'failed' : 'completed',
      videoUrl: failed ? undefined : randomVideo,
      thumbnailUrl: failed ? undefined : 'https://via.placeholder.com/270x480/6C5CE7/FFFFFF?text=Video',
      error: failed ? '模擬測試失敗' : undefined,
    };
  }

  const res = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`查詢狀態失敗：${text}`);
  }

  const data = await res.json();

  // Map Sora status to our status
  let status: GenerationJobResponse['status'] = 'processing';
  if (data.status === 'completed') status = 'completed';
  else if (data.status === 'failed') status = 'failed';
  else if (data.status === 'queued') status = 'queued';

  // 如果完成，取得影片內容 URL
  let videoUrl: string | undefined;
  if (status === 'completed') {
    videoUrl = `https://api.openai.com/v1/videos/${jobId}/content`;
  }

  return {
    jobId,
    status,
    videoUrl,
    progress: data.progress ?? 0,
    error: data.error?.message,
  };
};

// ────────────────────────────────────────
// Download video content (需要認證)
// ────────────────────────────────────────
export const getVideoDownloadUrl = async (jobId: string): Promise<string> => {
  // Sora API 需要認證才能下載，所以我們需要 fetch 後轉成 blob URL
  // 或者直接回傳需要認證的 URL，讓前端處理
  const res = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error('下載影片失敗');
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// ────────────────────────────────────────
// Wait until job completes (simple polling loop)
// ────────────────────────────────────────
export const waitForCompletion = async (
  jobId: string,
  maxAttempts = 60,
  intervalMs = 2000,
): Promise<GenerationJobResponse> => {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await pollJobStatus(jobId);
    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Generation timed out');
};
