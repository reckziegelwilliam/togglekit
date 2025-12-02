/**
 * Web/Browser feature flag client
 */

import { Evaluator } from '@togglekit/flags-core-ts';
import { WebFlagClientOptions, Context, EvaluationResult, FlagConfig } from './types';
import { fetchConfig } from './fetcher';

/**
 * Feature flag client for web/browser environments
 * 
 * Supports bootstrap mode for SSR and optional background refresh
 */
export class WebFlagClient {
  private evaluator: Evaluator;
  private options: Required<Omit<WebFlagClientOptions, 'bootstrapConfig' | 'apiUrl' | 'apiKey'>>;
  private apiUrl?: string;
  private apiKey?: string;
  private refreshTimer?: number;
  private isInitialized = false;
  private isClosed = false;
  private listeners: Array<() => void> = [];

  /**
   * Create a new web flag client
   * Use the `createFlagClient` factory function instead
   */
  constructor(config: FlagConfig, options: WebFlagClientOptions) {
    this.evaluator = new Evaluator(config);
    this.apiUrl = options.apiUrl;
    this.apiKey = options.apiKey;
    this.options = {
      enableRefresh: options.enableRefresh ?? false,
      refreshInterval: options.refreshInterval ?? 60000,
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

    this.refreshTimer = window.setInterval(async () => {
      try {
        await this.refresh();
      } catch (error) {
        // Log error but don't throw - continue using cached config
        console.error('Failed to refresh flag config:', error);
      }
    }, this.options.refreshInterval);
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

    // Notify listeners of config update
    this.notifyListeners();
  }

  /**
   * Manually update the client configuration
   * Useful for SSR scenarios where config is fetched separately
   * 
   * @param config - New flag configuration
   */
  updateConfig(config: FlagConfig): void {
    if (this.isClosed) {
      throw new Error('Client is closed');
    }

    this.evaluator = new Evaluator(config);
    this.notifyListeners();
  }

  /**
   * Subscribe to config update events
   * Returns unsubscribe function
   * 
   * @param listener - Callback to invoke when config updates
   * @returns Function to unsubscribe
   */
  onConfigUpdate(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of config update
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in config update listener:', error);
      }
    });
  }

  /**
   * Evaluate a boolean feature flag
   * 
   * @param flagKey - The flag key to evaluate
   * @param context - User context with attributes
   * @returns Evaluation result with boolean value and reason
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
   */
  getVariant(flagKey: string, context: Context): EvaluationResult<string> {
    if (this.isClosed) {
      throw new Error('Client is closed');
    }

    return this.evaluator.evalVariant(flagKey, context);
  }

  /**
   * Get the current configuration
   */
  getConfig(): FlagConfig {
    return this.evaluator.getConfig();
  }

  /**
   * Check if a flag exists
   */
  hasFlag(flagKey: string): boolean {
    return this.evaluator.hasFlag(flagKey);
  }

  /**
   * Get all flag keys
   */
  getFlagKeys(): string[] {
    return this.evaluator.getFlagKeys();
  }

  /**
   * Close the client and stop any refresh timers
   */
  close(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.listeners = [];
    this.isClosed = true;
  }

  /**
   * Check if the client is ready
   */
  isReady(): boolean {
    return this.isInitialized && !this.isClosed;
  }
}

/**
 * Create a new web flag client
 * 
 * @param options - Client configuration options
 * @returns Initialized flag client (synchronous if bootstrap provided)
 * 
 * @example
 * ```typescript
 * // Bootstrap mode (SSR)
 * const client = createFlagClient({
 *   bootstrapConfig: window.__FLAGS_CONFIG__,
 * });
 * 
 * // With API fetch
 * const client = await createFlagClient({
 *   apiUrl: 'https://api.togglekit.com',
 *   apiKey: 'your-api-key',
 *   enableRefresh: true,
 * });
 * 
 * // Use the client
 * const result = client.getBool('dark-mode', { attributes: {} });
 * ```
 */
export function createFlagClient(
  options: WebFlagClientOptions
): WebFlagClient | Promise<WebFlagClient> {
  // Synchronous bootstrap mode
  if (options.bootstrapConfig) {
    const client = new WebFlagClient(options.bootstrapConfig, options);
    
    // Start refresh in background if configured
    if (options.apiUrl && options.apiKey && options.enableRefresh) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).startRefresh();
    }
    
    return client;
  }

  // Async fetch mode
  if (options.apiUrl && options.apiKey) {
    return fetchConfig(
      options.apiUrl,
      options.apiKey,
      options.timeout,
      options.fetchFn
    ).then(config => {
      const client = new WebFlagClient(config, options);
      
      // Start refresh if enabled
      if (options.enableRefresh) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).startRefresh();
      }
      
      return client;
    });
  }

  throw new Error(
    'Either bootstrapConfig or both apiUrl and apiKey must be provided'
  );
}

