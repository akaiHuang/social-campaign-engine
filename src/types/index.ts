export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type GenerationQuality = 'standard' | 'high';

export interface GenerationRequest {
  prompt: string;
  theme: string;
  style: string;
  camera: string;
  quality: GenerationQuality;
}

export interface VideoItem {
  id: string;
  prompt: string;
  theme: string;
  style: string;
  camera: string;
  quality: GenerationQuality;
  status: VideoStatus;
  createdAt: string;
  durationSec: number;
  creditsCost: number;
  errorMessage?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceLabel: string;
}
