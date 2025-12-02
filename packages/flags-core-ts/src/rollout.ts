/**
 * Rollout hashing utilities for deterministic percentage bucketing
 */

/**
 * Simple hash function for strings
 * Uses a basic polynomial rolling hash algorithm
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Compute a deterministic rollout bucket (0-100) for a user and flag
 * 
 * Given the same userId and flagKey, this will always return the same bucket.
 * This ensures consistent feature flag behavior for each user.
 * 
 * @param userId - Unique user identifier
 * @param flagKey - Feature flag key
 * @returns A bucket number between 0 and 100 (inclusive)
 * 
 * @example
 * ```typescript
 * const bucket = computeRolloutBucket('user-123', 'new-feature');
 * // bucket will always be the same for this user/flag combination
 * if (bucket <= 25) {
 *   // User is in the 25% rollout
 * }
 * ```
 */
export function computeRolloutBucket(userId: string, flagKey: string): number {
  // Combine userId and flagKey to create a unique hash input
  const combined = `${userId}:${flagKey}`;
  const hash = simpleHash(combined);
  
  // Map hash to 0-100 range
  // Using 101 to ensure even distribution including 100
  return hash % 101;
}

