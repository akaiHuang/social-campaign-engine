import { GenerationRequest, VideoItem, VideoStatus } from '../types';

const BASE_COST = 20;
const HQ_EXTRA_COST = 10;

export const estimateCredits = (request: GenerationRequest) =>
  BASE_COST + (request.quality === 'high' ? HQ_EXTRA_COST : 0);

export const buildMockVideo = (
  id: string,
  request: GenerationRequest,
  creditsCost: number,
): VideoItem => ({
  id,
  prompt: request.prompt,
  theme: request.theme,
  style: request.style,
  camera: request.camera,
  quality: request.quality,
  status: 'processing',
  createdAt: new Date().toISOString(),
  durationSec: 8,
  creditsCost,
});

export const updateVideoStatus = (
  item: VideoItem,
  status: VideoStatus,
  errorMessage?: string,
): VideoItem => ({
  ...item,
  status,
  errorMessage,
});
