/**
 * Tests for the Node.js flag client
 */

import { createFlagClient, FlagClient } from '../src/client';
import { FlagConfig } from '../src/types';

// Mock config for testing
const mockConfig: FlagConfig = {
  'simple-flag': {
    key: 'simple-flag',
    defaultValue: true,
  },
  'premium-feature': {
    key: 'premium-feature',
    defaultValue: false,
    rules: [
      {
        conditions: [
          { attribute: 'plan', operator: 'eq', value: 'premium' },
        ],
        value: true,
      },
    ],
  },
  'layout-variant': {
    key: 'layout-variant',
    defaultValue: 'control',
    variants: [
      { key: 'control' },
      { key: 'variant-a' },
      { key: 'variant-b' },
    ],
    rules: [
      {
        conditions: [
          { attribute: 'country', operator: 'eq', value: 'US' },
        ],
        variant: 'variant-a',
      },
    ],
  },
  'rollout-flag': {
    key: 'rollout-flag',
    defaultValue: false,
    rules: [
      {
        conditions: [
          { attribute: 'enrolled', operator: 'eq', value: true },
        ],
        percentage: 50,
        value: true,
      },
    ],
  },
};

describe('createFlagClient', () => {
  describe('with static config', () => {
    it('should create client with static configuration', async () => {
      const client = await createFlagClient({
        staticConfig: mockConfig,
      });

      expect(client).toBeInstanceOf(FlagClient);
      expect(client.isReady()).toBe(true);
      client.close();
    });

    it('should throw error when no config or API credentials provided', async () => {
      await expect(createFlagClient({})).rejects.toThrow(
        'Either staticConfig or both apiUrl and apiKey must be provided'
      );
    });
  });

  describe('with API fetch', () => {
    it('should fetch config from API on initialization', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      });

      const client = await createFlagClient({
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        fetchFn: mockFetch as any,
        enableRefresh: false,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/config',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(client.isReady()).toBe(true);
      client.close();
    });

    it('should throw error when API fetch fails', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        createFlagClient({
          apiUrl: 'https://api.example.com',
          apiKey: 'test-key',
          fetchFn: mockFetch as any,
        })
      ).rejects.toThrow('Failed to fetch config: 404 Not Found');
    });

    it('should handle network errors', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        createFlagClient({
          apiUrl: 'https://api.example.com',
          apiKey: 'test-key',
          fetchFn: mockFetch as any,
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      const mockFetch = jest.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('Timeout');
              (error as any).name = 'AbortError';
              reject(error);
            }, 100);
          })
      );

      await expect(
        createFlagClient({
          apiUrl: 'https://api.example.com',
          apiKey: 'test-key',
          fetchFn: mockFetch as any,
          timeout: 50,
        })
      ).rejects.toThrow('Config fetch timeout after 50ms');
    });
  });
});

describe('FlagClient', () => {
  let client: FlagClient;

  beforeEach(async () => {
    client = await createFlagClient({
      staticConfig: mockConfig,
      enableRefresh: false,
    });
  });

  afterEach(() => {
    client.close();
  });

  describe('getBool', () => {
    it('should evaluate simple boolean flag', () => {
      const result = client.getBool('simple-flag', { attributes: {} });
      
      expect(result.value).toBe(true);
      expect(result.reason).toBe('default');
    });

    it('should evaluate flag with rule match', () => {
      const result = client.getBool('premium-feature', {
        attributes: { plan: 'premium' },
      });
      
      expect(result.value).toBe(true);
      expect(result.reason).toBe('rule_match');
      expect(result.metadata?.ruleIndex).toBe(0);
    });

    it('should return default when rule does not match', () => {
      const result = client.getBool('premium-feature', {
        attributes: { plan: 'free' },
      });
      
      expect(result.value).toBe(false);
      expect(result.reason).toBe('default');
    });

    it('should return false for non-existent flag', () => {
      const result = client.getBool('non-existent', { attributes: {} });
      
      expect(result.value).toBe(false);
      expect(result.reason).toBe('flag_not_found');
      expect(result.metadata?.error).toContain('not found');
    });

    it('should handle rollout flags with userId', () => {
      // Test that rollout produces deterministic results
      const result1 = client.getBool('rollout-flag', {
        userId: 'user-1',
        attributes: { enrolled: true },
      });
      const result2 = client.getBool('rollout-flag', {
        userId: 'user-1',
        attributes: { enrolled: true },
      });
      const result3 = client.getBool('rollout-flag', {
        userId: 'user-2',
        attributes: { enrolled: true },
      });
      
      // Same user gets same result
      expect(result1.value).toBe(result2.value);
      expect(result1.reason).toBe(result2.reason);
      
      // Results should be either rollout or rollout_excluded
      expect(result1.reason).toMatch(/^(rollout|rollout_excluded)$/);
      expect(result3.reason).toMatch(/^(rollout|rollout_excluded)$/);
      
      // Bucket should be provided
      expect(typeof result1.metadata?.bucket).toBe('number');
    });

    it('should throw error when client is closed', () => {
      client.close();
      
      expect(() => {
        client.getBool('simple-flag', { attributes: {} });
      }).toThrow('Client is closed');
    });
  });

  describe('getVariant', () => {
    it('should evaluate variant flag with default', () => {
      const result = client.getVariant('layout-variant', {
        attributes: { country: 'UK' },
      });
      
      expect(result.value).toBe('control');
      expect(result.reason).toBe('default');
    });

    it('should evaluate variant flag with rule match', () => {
      const result = client.getVariant('layout-variant', {
        attributes: { country: 'US' },
      });
      
      expect(result.value).toBe('variant-a');
      expect(result.reason).toBe('rule_match');
      expect(result.metadata?.ruleIndex).toBe(0);
    });

    it('should return default variant for non-existent flag', () => {
      const result = client.getVariant('non-existent', { attributes: {} });
      
      expect(result.value).toBe('default');
      expect(result.reason).toBe('flag_not_found');
    });
  });

  describe('refresh', () => {
    it('should update config when refreshed', async () => {
      let fetchCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        fetchCount++;
        if (fetchCount === 1) {
          // Initial config without new-flag
          return Promise.resolve({
            ok: true,
            json: async () => mockConfig,
          });
        } else {
          // Updated config with new-flag
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...mockConfig,
              'new-flag': {
                key: 'new-flag',
                defaultValue: true,
              },
            }),
          });
        }
      });

      const refreshableClient = await createFlagClient({
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        fetchFn: mockFetch as any,
        enableRefresh: false,
      });

      // Initially doesn't have new-flag
      expect(refreshableClient.hasFlag('new-flag')).toBe(false);

      // Refresh with new config
      await refreshableClient.refresh();

      // Now has new-flag
      expect(refreshableClient.hasFlag('new-flag')).toBe(true);
      
      refreshableClient.close();
    });

    it('should throw error when refreshing without API credentials', async () => {
      await expect(client.refresh()).rejects.toThrow(
        'Cannot refresh: API URL and key required'
      );
    });

    it('should throw error when refreshing closed client', async () => {
      client.close();
      
      await expect(client.refresh()).rejects.toThrow('Client is closed');
    });
  });

  describe('utility methods', () => {
    it('should get current config', () => {
      const config = client.getConfig();
      
      expect(config).toEqual(mockConfig);
    });

    it('should check if flag exists', () => {
      expect(client.hasFlag('simple-flag')).toBe(true);
      expect(client.hasFlag('non-existent')).toBe(false);
    });

    it('should get all flag keys', () => {
      const keys = client.getFlagKeys();
      
      expect(keys).toHaveLength(4);
      expect(keys).toContain('simple-flag');
      expect(keys).toContain('premium-feature');
      expect(keys).toContain('layout-variant');
      expect(keys).toContain('rollout-flag');
    });

    it('should report ready status', () => {
      expect(client.isReady()).toBe(true);
      
      client.close();
      
      expect(client.isReady()).toBe(false);
    });
  });

  describe('automatic refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should automatically refresh config at interval', async () => {
      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        callCount++;
        const dynamicConfig = { ...mockConfig };
        const flagKey = `flag-${callCount}`;
        dynamicConfig[flagKey] = {
          key: flagKey,
          defaultValue: true,
        };
        return Promise.resolve({
          ok: true,
          json: async () => dynamicConfig,
        });
      });

      const refreshClient = await createFlagClient({
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        fetchFn: mockFetch as any,
        enableRefresh: true,
        refreshInterval: 1000,
      });

      // Initial fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait for first refresh
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Let promises resolve
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Wait for second refresh
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(3);

      refreshClient.close();
    });

    it('should not refresh when enableRefresh is false', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      });

      const noRefreshClient = await createFlagClient({
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        fetchFn: mockFetch as any,
        enableRefresh: false,
      });

      // Only initial fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait and verify no additional fetches
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      noRefreshClient.close();
    });

    it('should stop refreshing after close', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      });

      const refreshClient = await createFlagClient({
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        fetchFn: mockFetch as any,
        enableRefresh: true,
        refreshInterval: 1000,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Close client
      refreshClient.close();

      // Advance time and verify no more fetches
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

