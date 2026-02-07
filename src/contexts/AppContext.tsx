import React, { createContext, useContext, useMemo, useState } from 'react';
import { creditPacks } from '../constants/promptTemplates';
import type { CreditPack, GenerationRequest, VideoItem } from '../types';
import { buildMockVideo, estimateCredits, updateVideoStatus } from '../services/videoGeneration';
import { submitGenerationJob, waitForCompletion, openaiReady } from '../services/openai';

interface AppContextValue {
  credits: number;
  videos: VideoItem[];
  generateVideo: (request: GenerationRequest) => Promise<VideoItem>;
  purchaseCredits: (pack: CreditPack) => void;
  getVideoById: (id: string) => VideoItem | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

const seedVideos: VideoItem[] = [
  {
    id: 'vid-001',
    prompt: 'A glowing subway station with soft fog and neon reflections.',
    theme: 'Neon Rain Night',
    style: 'Cinematic Realism',
    camera: 'Dolly In',
    quality: 'high',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    durationSec: 9,
    creditsCost: 30,
    // 使用真實的測試影片（公開的 MP4 範例）
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/270x480/6C5CE7/FFFFFF?text=Video+1',
  },
  {
    id: 'vid-002',
    prompt: 'A claymation cat traveling through a postcard village.',
    theme: 'Travel Postcard',
    style: 'Claymation',
    camera: 'Handheld',
    quality: 'standard',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    durationSec: 8,
    creditsCost: 20,
    // 使用真實的測試影片
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/270x480/00CEC9/FFFFFF?text=Video+2',
  },
];

const randomPack = creditPacks[1];

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [credits, setCredits] = useState(140);
  const [videos, setVideos] = useState<VideoItem[]>(seedVideos);

  const generateVideo = async (request: GenerationRequest) => {
    const cost = estimateCredits(request);
    if (credits < cost) {
      throw new Error('Not enough credits for this generation.');
    }

    const id = `vid-${Math.random().toString(36).slice(2, 9)}`;
    const draft = buildMockVideo(id, request, cost);
    setCredits((value) => value - cost);
    setVideos((items) => [draft, ...items]);

    // Fire async job (OpenAI or mock)
    (async () => {
      try {
        const job = await submitGenerationJob(request);
        const result = await waitForCompletion(job.jobId);
        setVideos((items) =>
          items.map((item) =>
            item.id === id
              ? updateVideoStatus(
                  { ...item, videoUrl: result.videoUrl, thumbnailUrl: result.thumbnailUrl },
                  result.status === 'completed' ? 'completed' : 'failed',
                  result.error,
                )
              : item,
          ),
        );
        if (result.status === 'failed') {
          setCredits((v) => v + cost);
        }
      } catch (err) {
        setVideos((items) =>
          items.map((item) =>
            item.id === id
              ? updateVideoStatus(item, 'failed', (err as Error).message)
              : item,
          ),
        );
        setCredits((v) => v + cost);
      }
    })();

    return draft;
  };

  const purchaseCredits = (pack: CreditPack = randomPack) => {
    setCredits((value) => value + pack.credits);
  };

  const getVideoById = (id: string) => videos.find((item) => item.id === id);

  const value = useMemo(
    () => ({
      credits,
      videos,
      generateVideo,
      purchaseCredits,
      getVideoById,
    }),
    [credits, videos],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
