/**
 * Types for the Web/Browser feature flag client
 */

import { FlagConfig, Context, EvaluationResult } from '@togglekit/flags-core-ts';

/**
 * Options for creating a web flag client
 */
export interface WebFlagClientOptions {
  /**
   * Bootstrap configuration loaded inline (e.g., from SSR)
   * Allows synchronous client creation
   */
  bootstrapConfig?: FlagConfig;

  /**
   * API URL for fetching flag configuration
   * Optional - if not provided, client works in bootstrap-only mode
   */
  apiUrl?: string;

  /**
   * API key for authentication
   * Required if apiUrl is provided
   */
  apiKey?: string;

  /**
   * Enable automatic background refresh
   * @default false
   */
  enableRefresh?: boolean;

  /**
   * Interval in milliseconds for refreshing config
   * @default 60000 (60 seconds)
   */
  refreshInterval?: number;

  /**
   * Timeout in milliseconds for API requests
   * @default 5000 (5 seconds)
   */
  timeout?: number;

  /**
   * Custom fetch function (for testing)
   */
  fetchFn?: typeof fetch;
}

/**
 * Export core types from flags-core-ts for convenience
 */
export { FlagConfig, Context, EvaluationResult };

