/**
 * Rollout hashing utilities for deterministic percentage bucketing
 */
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
export declare function computeRolloutBucket(userId: string, flagKey: string): number;
//# sourceMappingURL=rollout.d.ts.map