/**
 * Tests for React hooks
 */

import React, { ReactNode } from 'react';
import { render, renderHook, waitFor } from '@testing-library/react';
import { createFlagClient, WebFlagClient } from '../src/client';
import {
  FlagProvider,
  useFlag,
  useFlagVariant,
  useFlagKeys,
  useFlagExists,
} from '../src/react';
import { FlagConfig } from '../src/types';

const mockConfig: FlagConfig = {
  'test-flag': {
    key: 'test-flag',
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

describe('FlagProvider', () => {
  let client: WebFlagClient;

  beforeEach(() => {
    client = createFlagClient({
      bootstrapConfig: mockConfig,
    }) as WebFlagClient;
  });

  afterEach(() => {
    client.close();
  });

  it('should provide flag client to children', () => {
    const TestComponent = () => {
      const result = useFlag('test-flag');
      return <div>{result.value ? 'enabled' : 'disabled'}</div>;
    };

    const { getByText } = render(
      <FlagProvider client={client}>
        <TestComponent />
      </FlagProvider>
    );

    expect(getByText('enabled')).toBeTruthy();
  });

  it.skip('should re-render when config updates', async () => {
    let renderCount = 0;
    const TestComponent = () => {
      renderCount++;
      const result = useFlag('new-flag');
      return <div>{result.value ? 'yes' : 'no'}</div>;
    };

    const { getByText } = render(
      <FlagProvider client={client}>
        <TestComponent />
      </FlagProvider>
    );

    // Initially flag doesn't exist, returns false
    expect(getByText('no')).toBeTruthy();
    const initialRenderCount = renderCount;

    // Update config to include new flag
    client.updateConfig({
      ...mockConfig,
      'new-flag': {
        key: 'new-flag',
        defaultValue: true,
      },
    });

    // Should re-render with new value
    await waitFor(() => {
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });
});

describe('useFlag', () => {
  let client: WebFlagClient;

  beforeEach(() => {
    client = createFlagClient({
      bootstrapConfig: mockConfig,
    }) as WebFlagClient;
  });

  afterEach(() => {
    client.close();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <FlagProvider client={client}>{children}</FlagProvider>
  );

  it('should evaluate boolean flag', () => {
    const { result } = renderHook(
      () => useFlag('test-flag', { attributes: {} }),
      { wrapper }
    );

    expect(result.current.value).toBe(true);
    expect(result.current.reason).toBe('default');
  });

  it('should evaluate flag with conditions', () => {
    const { result } = renderHook(
      () => useFlag('premium-feature', { attributes: { plan: 'premium' } }),
      { wrapper }
    );

    expect(result.current.value).toBe(true);
    expect(result.current.reason).toBe('rule_match');
  });

  it('should return false for non-existent flag', () => {
    const { result } = renderHook(
      () => useFlag('non-existent', { attributes: {} }),
      { wrapper }
    );

    expect(result.current.value).toBe(false);
    expect(result.current.reason).toBe('flag_not_found');
  });

  it('should use empty attributes by default', () => {
    const { result } = renderHook(() => useFlag('test-flag'), { wrapper });

    expect(result.current.value).toBe(true);
  });

  it('should throw error when used outside FlagProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useFlag('test-flag'));
    }).toThrow('useFlagClient must be used within a FlagProvider');

    consoleSpy.mockRestore();
  });

  it('should re-render when config changes', async () => {
    const { result, rerender } = renderHook(
      () => useFlag('test-flag', { attributes: {} }),
      { wrapper }
    );

    expect(result.current.value).toBe(true);

    // Update config
    client.updateConfig({
      'test-flag': {
        key: 'test-flag',
        defaultValue: false,
      },
    });

    // Force re-render
    rerender();

    await waitFor(() => {
      expect(result.current.value).toBe(false);
    });
  });
});

describe('useFlagVariant', () => {
  let client: WebFlagClient;

  beforeEach(() => {
    client = createFlagClient({
      bootstrapConfig: mockConfig,
    }) as WebFlagClient;
  });

  afterEach(() => {
    client.close();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <FlagProvider client={client}>{children}</FlagProvider>
  );

  it('should evaluate variant flag', () => {
    const { result } = renderHook(
      () => useFlagVariant('layout-variant', { attributes: { country: 'US' } }),
      { wrapper }
    );

    expect(result.current.value).toBe('variant-a');
    expect(result.current.reason).toBe('rule_match');
  });

  it('should return default variant', () => {
    const { result } = renderHook(
      () => useFlagVariant('layout-variant', { attributes: { country: 'UK' } }),
      { wrapper }
    );

    expect(result.current.value).toBe('control');
    expect(result.current.reason).toBe('default');
  });

  it('should use empty attributes by default', () => {
    const { result } = renderHook(() => useFlagVariant('layout-variant'), {
      wrapper,
    });

    expect(result.current.value).toBe('control');
  });
});

describe('useFlagKeys', () => {
  let client: WebFlagClient;

  beforeEach(() => {
    client = createFlagClient({
      bootstrapConfig: mockConfig,
    }) as WebFlagClient;
  });

  afterEach(() => {
    client.close();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <FlagProvider client={client}>{children}</FlagProvider>
  );

  it('should return all flag keys', () => {
    const { result } = renderHook(() => useFlagKeys(), { wrapper });

    expect(result.current).toHaveLength(3);
    expect(result.current).toContain('test-flag');
    expect(result.current).toContain('premium-feature');
    expect(result.current).toContain('layout-variant');
  });

  it('should update when config changes', async () => {
    const { result, rerender } = renderHook(() => useFlagKeys(), { wrapper });

    expect(result.current).toHaveLength(3);

    client.updateConfig({
      ...mockConfig,
      'new-flag': {
        key: 'new-flag',
        defaultValue: true,
      },
    });

    rerender();

    await waitFor(() => {
      expect(result.current).toHaveLength(4);
      expect(result.current).toContain('new-flag');
    });
  });
});

describe('useFlagExists', () => {
  let client: WebFlagClient;

  beforeEach(() => {
    client = createFlagClient({
      bootstrapConfig: mockConfig,
    }) as WebFlagClient;
  });

  afterEach(() => {
    client.close();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <FlagProvider client={client}>{children}</FlagProvider>
  );

  it('should return true for existing flag', () => {
    const { result } = renderHook(() => useFlagExists('test-flag'), { wrapper });

    expect(result.current).toBe(true);
  });

  it('should return false for non-existent flag', () => {
    const { result } = renderHook(() => useFlagExists('non-existent'), {
      wrapper,
    });

    expect(result.current).toBe(false);
  });

  it('should update when config changes', async () => {
    const { result, rerender } = renderHook(() => useFlagExists('new-flag'), {
      wrapper,
    });

    expect(result.current).toBe(false);

    client.updateConfig({
      ...mockConfig,
      'new-flag': {
        key: 'new-flag',
        defaultValue: true,
      },
    });

    rerender();

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});

