/**
 * @jest-environment node
 */
import { openaiReady, pollJobStatus } from '../services/openai';

describe('openai service', () => {
  it('openaiReady returns false when API key is missing', () => {
    // In test env, EXPO_PUBLIC_OPENAI_API_KEY is not set
    expect(openaiReady).toBe(false);
  });

  it('pollJobStatus returns mock result for mock job ids', async () => {
    const result = await pollJobStatus('mock-12345');
    expect(['completed', 'failed']).toContain(result.status);
  });
});
