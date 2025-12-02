/**
 * React hooks and context provider for Togglekit feature flags
 * 
 * @example
 * ```typescript
 * import { FlagProvider, useFlag } from '@togglekit/flags-client-web/react';
 * 
 * function App() {
 *   return (
 *     <FlagProvider client={client}>
 *       <MyComponent />
 *     </FlagProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const darkMode = useFlag('dark-mode', { attributes: {} });
 *   return <div>{darkMode.value ? 'Dark' : 'Light'}</div>;
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebFlagClient } from './client';
import { Context, EvaluationResult } from './types';

/**
 * React context for the flag client
 */
const FlagClientContext = createContext<WebFlagClient | null>(null);

/**
 * Props for FlagProvider
 */
export interface FlagProviderProps {
  /** The flag client instance */
  client: WebFlagClient;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component for feature flag client
 * 
 * Must wrap any components that use flag hooks
 */
export function FlagProvider({ client, children }: FlagProviderProps): JSX.Element {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Subscribe to config updates and force re-render
    const unsubscribe = client.onConfigUpdate(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, [client]);

  return (
    <FlagClientContext.Provider value={client}>
      {children}
    </FlagClientContext.Provider>
  );
}

/**
 * Hook to get the flag client from context
 * 
 * @throws Error if used outside FlagProvider
 */
function useFlagClient(): WebFlagClient {
  const client = useContext(FlagClientContext);
  if (!client) {
    throw new Error('useFlagClient must be used within a FlagProvider');
  }
  return client;
}

/**
 * Hook to evaluate a boolean feature flag
 * 
 * Re-renders when flag configuration updates
 * 
 * @param flagKey - The flag key to evaluate
 * @param context - User context with attributes (optional if userId not needed)
 * @returns Evaluation result with boolean value and reason
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const darkMode = useFlag('dark-mode', {
 *     attributes: { theme: 'auto' }
 *   });
 *   
 *   if (darkMode.value) {
 *     return <DarkTheme />;
 *   }
 *   return <LightTheme />;
 * }
 * ```
 */
export function useFlag(
  flagKey: string,
  context: Context = { attributes: {} }
): EvaluationResult<boolean> {
  const client = useFlagClient();
  return client.getBool(flagKey, context);
}

/**
 * Hook to evaluate a variant feature flag
 * 
 * Re-renders when flag configuration updates
 * 
 * @param flagKey - The flag key to evaluate
 * @param context - User context with attributes (optional if userId not needed)
 * @returns Evaluation result with variant key (string) and reason
 * 
 * @example
 * ```typescript
 * function PricingPage() {
 *   const layout = useFlagVariant('pricing-layout', {
 *     attributes: { country: 'US' }
 *   });
 *   
 *   switch (layout.value) {
 *     case 'layout-a':
 *       return <LayoutA />;
 *     case 'layout-b':
 *       return <LayoutB />;
 *     default:
 *       return <DefaultLayout />;
 *   }
 * }
 * ```
 */
export function useFlagVariant(
  flagKey: string,
  context: Context = { attributes: {} }
): EvaluationResult<string> {
  const client = useFlagClient();
  return client.getVariant(flagKey, context);
}

/**
 * Hook to get all flag keys
 * 
 * Useful for debugging or admin UIs
 * 
 * @example
 * ```typescript
 * function FlagList() {
 *   const flagKeys = useFlagKeys();
 *   return (
 *     <ul>
 *       {flagKeys.map(key => <li key={key}>{key}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useFlagKeys(): string[] {
  const client = useFlagClient();
  return client.getFlagKeys();
}

/**
 * Hook to check if a flag exists
 * 
 * @param flagKey - The flag key to check
 * @returns true if flag exists, false otherwise
 */
export function useFlagExists(flagKey: string): boolean {
  const client = useFlagClient();
  return client.hasFlag(flagKey);
}

