/**
 * Node.js feature flag client
 * Provides an ergonomic API for evaluating feature flags with config caching and refresh
 */

import { Evaluator } from '@togglekit/flags-core-ts';
import { FlagClientOptions, Context, EvaluationResult, FlagConfig } from './types';
import { fetchConfig } from './fetcher';

/**
 * Feature flag client for Node.js
 * 
 * Manages flag configuration, caching, and periodic refresh.
 * Evaluates flags using the TypeScript core evaluator.
 */
export class FlagClient {
  private evaluator: Evaluator;
  private options: Required<Omit<FlagClientOptions, 'staticConfig' | 'apiUrl' | 'apiKey'>>;
  private apiUrl?: string;
  private apiKey?: string;
  private refreshTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private isClosed = false;

  /**
   * Create a new flag client
   * Use the `createFlagClient` factory function instead of calling this directly
   */
  constructor(config: FlagConfig, options: FlagClientOptions) {
    this.evaluator = new Evaluator(config);
    this.apiUrl = options.apiUrl;
    this.apiKey = options.apiKey;
    this.options = {
      refreshInterval: options.refreshInterval ?? 30000,
      enableRefresh: options.enableRefresh ?? true,
      timeout: options.timeout ?? 5000,
      fetchFn: options.fetchFn ?? fetch,
    };
    this.isInitialized = true;
  }

  /**
   * Start automatic config refresh if enabled and API credentials provided
   */
  private startRefresh(): void {
    if (!this.options.enableRefresh || !this.apiUrl || !this.apiKey) {
      return;
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.refresh();
      } catch (error) {
        // Log error but don't throw - continue using cached config
        console.error('Failed to refresh flag config:', error);
      }
    }, this.options.refreshInterval);

    // Don't keep the process alive just for this timer
    if (this.refreshTimer.unref) {
      this.refreshTimer.unref();
    }
  }

  /**
   * Manually refresh the configuration from the API
   * 
   * @throws Error if API credentials not provided or fetch fails
   */
  async refresh(): Promise<void> {
    if (this.isClosed) {
      throw new Error('Client is closed');
    }

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Cannot refresh: API URL and key required');
    }

    const newConfig = await fetchConfig(
      this.apiUrl,
      this.apiKey,
      this.options.timeout,
      this.options.fetchFn
    );

    // Create new evaluator with updated config
    this.evaluator = new Evaluator(newConfig);
  }

  /**
   * Evaluate a boolean feature flag
   * 
   * @param flagKey - The flag key to evaluate
   * @param context - User context with attributes
   * @returns Evaluation result with boolean value and reason
   * 
   * @example
   * ```typescript
   * const result = client.getBool('dark-mode', {
   *   userId: 'user-123',
   *   attributes: { plan: 'premium' }
   * });
   * 
   * if (result.value) {
   *   // Enable dark mode
   * }
   * ```
   */
  getBool(flagKey: string, context: Context): EvaluationResult<boolean> {
    if (this.isClosed) {
      throw new Error('Client is closed');
    }

    return this.evaluator.evalBool(flagKey, context);
  }

  /**
   * Evaluate a variant feature flag
   * 
   * @param flagKey - The flag key to evaluate
   * @param context - User context with attributes
   * @returns Evaluation result with variant key (string) and reason
   * 
   * @example
   * ```typescript
   * const result = client.getVariant('pricing-page', {
   *   userId: 'user-123',
   *   attributes: { country: 'US' }
   * });
   * 
   * switch (result.value) {
   *   case 'layout-a':
   *     // Show layout A
   *     break;
   *   case 'layout-b':
   *     // Show layout B
   *     break;
   *   default:
   *     // Show default layout
   * }
   * ```
   */
  getVariant(flagKey: string, context: Context): EvaluationResult<string> {
    if (this.isClosed) {
      throw new Error('Client is closed');
    }

    return this.evaluator.evalVariant(flagKey, context);
  }

  /**
   * Get the current configuration
   * Useful for debugging or serialization
   */
  getConfig(): FlagConfig {
    return this.evaluator.getConfig();
  }

  /**
   * Check if a flag exists in the configuration
   */
  hasFlag(flagKey: string): boolean {
    return this.evaluator.hasFlag(flagKey);
  }

  /**
   * Get all flag keys in the configuration
   */
  getFlagKeys(): string[] {
    return this.evaluator.getFlagKeys();
  }

  /**
   * Close the client and stop any refresh timers
   * The client cannot be used after calling this method
   */
  close(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.isClosed = true;
  }

  /**
   * Check if the client is initialized and ready to use
   */
  isReady(): boolean {
    return this.isInitialized && !this.isClosed;
  }
}

/**
 * Create a new feature flag client
 * 
 * @param options - Client configuration options
 * @returns Promise resolving to initialized flag client
 * 
 * @example
 * ```typescript
 * // With API URL (when API is available)
 * const client = await createFlagClient({
 *   apiUrl: 'https://api.togglekit.com',
 *   apiKey: 'your-api-key',
 *   refreshInterval: 60000, // 60 seconds
 * });
 * 
 * // With static config (for testing or when API not available)
 * const client = await createFlagClient({
 *   staticConfig: {
 *     'my-flag': {
 *       key: 'my-flag',
 *       defaultValue: true,
 *     }
 *   }
 * });
 * 
 * // Use the client
 * const result = client.getBool('my-flag', { attributes: {} });
 * console.log(result.value);
 * 
 * // Cleanup when done
 * client.close();
 * ```
 */
export async function createFlagClient(
  options: FlagClientOptions
): Promise<FlagClient> {
  let config: FlagConfig;

  // Either use static config or fetch from API
  if (options.staticConfig) {
    config = options.staticConfig;
  } else if (options.apiUrl && options.apiKey) {
    config = await fetchConfig(
      options.apiUrl,
      options.apiKey,
      options.timeout,
      options.fetchFn
    );
  } else {
    throw new Error(
      'Either staticConfig or both apiUrl and apiKey must be provided'
    );
  }

  const client = new FlagClient(config, options);
  
  // Start automatic refresh if configured
  if (options.apiUrl && options.apiKey) {
    (client as any).startRefresh();
  }

  return client;
}

