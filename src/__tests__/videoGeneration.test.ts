/**
 * @jest-environment node
 */
import { estimateCredits } from '../services/videoGeneration';
import type { GenerationRequest } from '../types';

describe('estimateCredits', () => {
  const baseRequest: GenerationRequest = {
    prompt: 'Test prompt',
    theme: 'Neon Rain Night',
    style: 'Cinematic Realism',
    camera: 'Dolly In',
    quality: 'standard',
  };

  it('returns 20 for standard quality', () => {
    expect(estimateCredits(baseRequest)).toBe(20);
  });

  it('returns 30 for high quality', () => {
    expect(estimateCredits({ ...baseRequest, quality: 'high' })).toBe(30);
  });
});
