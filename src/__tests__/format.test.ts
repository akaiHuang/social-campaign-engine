/**
 * @jest-environment node
 */
import { formatDate, formatTime } from '../utils/format';

describe('formatDate', () => {
  it('formats ISO date string to readable format', () => {
    const result = formatDate('2026-01-23T10:30:00.000Z');
    expect(result).toMatch(/Jan|1/); // locale-dependent
  });
});

describe('formatTime', () => {
  it('formats ISO date string to time', () => {
    const result = formatTime('2026-01-23T10:30:00.000Z');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
