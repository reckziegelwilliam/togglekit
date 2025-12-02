/**
 * @togglekit/flags-client-web
 * 
 * Web/Browser SDK for Togglekit feature flags
 * 
 * @example
 * ```typescript
 * import { createFlagClient } from '@togglekit/flags-client-web';
 * 
 * // Bootstrap mode (SSR-friendly)
 * const client = createFlagClient({
 *   bootstrapConfig: window.__FLAGS_CONFIG__,
 * });
 * 
 * // Or fetch from API
 * const client = await createFlagClient({
 *   apiUrl: 'https://api.togglekit.com',
 *   apiKey: 'your-api-key',
 * });
 * 
 * const result = client.getBool('dark-mode', {
 *   attributes: { theme: 'auto' }
 * });
 * ```
 */

export { createFlagClient, WebFlagClient } from './client';
export { fetchConfig } from './fetcher';
export type {
  WebFlagClientOptions,
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
