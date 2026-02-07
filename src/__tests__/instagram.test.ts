/**
 * @jest-environment node
 */
import { instagramReady } from '../services/instagram';

describe('instagram service', () => {
  it('instagramReady returns false when Meta keys are missing', () => {
    expect(instagramReady).toBe(false);
  });
});
