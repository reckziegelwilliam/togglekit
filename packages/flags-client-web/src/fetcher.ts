/**
 * Configuration fetcher for browser environments
 */

import { FlagConfig } from '@togglekit/flags-core-ts';

/**
 * Fetch configuration from the API (browser version)
 * 
 * @param apiUrl - Base URL of the API
 * @param apiKey - API key for authentication
 * @param timeout - Request timeout in milliseconds
 * @param fetchFn - Optional custom fetch function
 * @returns Promise resolving to flag configuration
 * 
 * @throws Error if fetch fails or returns non-200 status
 */
export async function fetchConfig(
  apiUrl: string,
  apiKey: string,
  timeout = 5000,
  fetchFn: typeof fetch = fetch
): Promise<FlagConfig> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchFn(`${apiUrl}/v1/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch config: ${response.status} ${response.statusText}`
      );
    }

    const config = await response.json() as FlagConfig;
    return config;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Config fetch timeout after ${timeout}ms`);
      }
      throw error;
    }
    
    throw new Error('Unknown error fetching config');
  }
}

