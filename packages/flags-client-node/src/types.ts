/**
 * Types for the Node.js feature flag client
 */

import { FlagConfig, Context, EvaluationResult } from '@togglekit/flags-core-ts';

/**
 * Options for creating a flag client
 */
export interface FlagClientOptions {
  /**
   * API URL for fetching flag configuration
   * @example 'https://api.togglekit.com'
   */
  apiUrl?: string;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Interval in milliseconds for refreshing config
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;

  /**
   * Static configuration (alternative to fetching from API)
   * Useful for testing or when API is not available yet
   */
  staticConfig?: FlagConfig;

  /**
   * Enable automatic refresh of configuration
   * @default true
   */
  enableRefresh?: boolean;

  /**
   * Timeout in milliseconds for API requests
   * @default 5000 (5 seconds)
   */
  timeout?: number;

  /**
   * Custom fetch function (for testing or custom HTTP clients)
   */
  fetchFn?: typeof fetch;
}

/**
 * Export core types from flags-core-ts for convenience
 */
export { FlagConfig, Context, EvaluationResult };

