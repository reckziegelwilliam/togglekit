/**
 * Tests for the Web flag client
 */

import { createFlagClient, WebFlagClient } from '../src/client';
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
};

describe('createFlagClient', () => {
  describe('bootstrap mode', () => {
    it('should create client synchronously with bootstrap config', () => {
      const client = createFlagClient({
        bootstrapConfig: mockConfig,
      });

      expect(client).toBeInstanceOf(WebFlagClient);
      expect((client as WebFlagClient).isReady()).toBe(true);
      (client as WebFlagClient).close();
    });

    it('should throw error when no config or API credentials provided', () => {
      expect(() => createFlagClient({})).toThrow(
        'Either bootstrapConfig or both apiUrl and apiKey must be provided'
      );
    });
  });

  describe('fetch mode', () => {
    it('should fetch config from API on initialization', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      });

      const clientPromise = createFlagClient({
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        fetchFn: mockFetch as any,
        enableRefresh: false,
      });

      expect(clientPromise).toBeInstanceOf(Promise);
      const client = await clientPromise;

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
  });
});

describe('WebFlagClient', () => {
  let client: WebFlagClient;

  beforeEach(() => {
    client = createFlagClient({
      bootstrapConfig: mockConfig,
      enableRefresh: false,
    }) as WebFlagClient;
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
    });
  });

  describe('updateConfig', () => {
    it('should update config manually', () => {
      const newConfig: FlagConfig = {
        'new-flag': {
          key: 'new-flag',
          defaultValue: true,
        },
      };

      expect(client.hasFlag('new-flag')).toBe(false);
      
      client.updateConfig(newConfig);
      
      expect(client.hasFlag('new-flag')).toBe(true);
      const result = client.getBool('new-flag', { attributes: {} });
      expect(result.value).toBe(true);
    });

    it('should notify listeners when config updates', () => {
      const listener = jest.fn();
      client.onConfigUpdate(listener);

      const newConfig: FlagConfig = {
        'test-flag': {
          key: 'test-flag',
          defaultValue: false,
        },
      };

      client.updateConfig(newConfig);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should throw error when updating closed client', () => {
      client.close();
      
      expect(() => {
        client.updateConfig({});
      }).toThrow('Client is closed');
    });
  });

  describe('onConfigUpdate', () => {
    it('should subscribe to config updates', () => {
      const listener = jest.fn();
      const unsubscribe = client.onConfigUpdate(listener);

      client.updateConfig(mockConfig);
      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      client.updateConfig(mockConfig);
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      client.onConfigUpdate(listener1);
      client.onConfigUpdate(listener2);

      client.updateConfig(mockConfig);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      client.onConfigUpdate(errorListener);
      client.onConfigUpdate(goodListener);

      // Should not throw
      expect(() => client.updateConfig(mockConfig)).not.toThrow();
      
      // Both listeners should have been called
      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should update config when refreshed', async () => {
      let fetchCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        fetchCount++;
        if (fetchCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => mockConfig,
          });
        } else {
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
      }) as WebFlagClient;

      expect(refreshableClient.hasFlag('new-flag')).toBe(false);

      await refreshableClient.refresh();

      expect(refreshableClient.hasFlag('new-flag')).toBe(true);
      refreshableClient.close();
    });

    it('should throw error when refreshing without API credentials', async () => {
      await expect(client.refresh()).rejects.toThrow(
        'Cannot refresh: API URL and key required'
      );
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
      expect(keys).toHaveLength(3);
      expect(keys).toContain('simple-flag');
      expect(keys).toContain('premium-feature');
      expect(keys).toContain('layout-variant');
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
      }) as WebFlagClient;

      expect(mockFetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(2);

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
      }) as WebFlagClient;

      expect(mockFetch).toHaveBeenCalledTimes(1);

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
      }) as WebFlagClient;

      expect(mockFetch).toHaveBeenCalledTimes(1);

      refreshClient.close();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

