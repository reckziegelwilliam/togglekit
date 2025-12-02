/**
 * Tests for rollout hashing
 */

import { computeRolloutBucket } from '../src/rollout';

describe('computeRolloutBucket', () => {
  it('should return a value between 0 and 100', () => {
    const bucket = computeRolloutBucket('user-123', 'test-flag');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThanOrEqual(100);
  });

  it('should be deterministic - same inputs produce same output', () => {
    const bucket1 = computeRolloutBucket('user-123', 'test-flag');
    const bucket2 = computeRolloutBucket('user-123', 'test-flag');
    expect(bucket1).toBe(bucket2);
  });

  it('should produce different buckets for different users', () => {
    const bucket1 = computeRolloutBucket('user-1', 'test-flag');
    const bucket2 = computeRolloutBucket('user-2', 'test-flag');
    // While theoretically they could be equal, very unlikely
    expect(bucket1).not.toBe(bucket2);
  });

  it('should produce different buckets for different flags', () => {
    const bucket1 = computeRolloutBucket('user-123', 'flag-a');
    const bucket2 = computeRolloutBucket('user-123', 'flag-b');
    // While theoretically they could be equal, very unlikely
    expect(bucket1).not.toBe(bucket2);
  });

  it('should handle empty strings', () => {
    const bucket = computeRolloutBucket('', '');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThanOrEqual(100);
  });

  it('should handle special characters', () => {
    const bucket = computeRolloutBucket('user@example.com', 'flag-with-dashes');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThanOrEqual(100);
  });

  it('should distribute users across buckets', () => {
    const buckets = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const bucket = computeRolloutBucket(`user-${i}`, 'test-flag');
      buckets.add(bucket);
    }
    // Should have reasonable distribution - at least 20 unique buckets out of 100 users
    expect(buckets.size).toBeGreaterThan(20);
  });
});

