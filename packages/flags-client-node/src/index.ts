/**
 * @togglekit/flags-client-node
 * 
 * Node.js SDK for Togglekit feature flags
 * 
 * @example
 * ```typescript
 * import { createFlagClient } from '@togglekit/flags-client-node';
 * 
 * const client = await createFlagClient({
 *   apiUrl: 'https://api.togglekit.com',
 *   apiKey: 'your-api-key',
 * });
 * 
 * const result = client.getBool('new-feature', {
 *   userId: 'user-123',
 *   attributes: { plan: 'premium' }
 * });
 * 
 * console.log(result.value); // true or false
 * console.log(result.reason); // 'rule_match', 'default', etc.
 * 
 * client.close();
 * ```
 */

export { createFlagClient, FlagClient } from './client';
export { fetchConfig } from './fetcher';
export type {
  FlagClientOptions,
  FlagConfig,
  Context,
  EvaluationResult,
} from './types';

// Re-export useful types from core
export type {
  Flag,
  Rule,
  Condition,
  Variant,
  ConditionOperator,
  EvaluationReason,
} from '@togglekit/flags-core-ts';
