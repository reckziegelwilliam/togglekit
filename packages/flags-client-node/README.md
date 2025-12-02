# @togglekit/flags-client-node

Node.js SDK for Togglekit feature flags.

## Installation

```bash
npm install @togglekit/flags-client-node
# or
pnpm add @togglekit/flags-client-node
# or
yarn add @togglekit/flags-client-node
```

## Quick Start

```typescript
import { createFlagClient } from '@togglekit/flags-client-node';

// Create client with API connection
const client = await createFlagClient({
  apiUrl: 'https://api.togglekit.com',
  apiKey: 'your-api-key',
  refreshInterval: 30000, // Refresh every 30 seconds
});

// Or use static configuration (for testing/development)
const client = await createFlagClient({
  staticConfig: {
    'dark-mode': {
      key: 'dark-mode',
      defaultValue: false,
      rules: [
        {
          conditions: [
            { attribute: 'plan', operator: 'eq', value: 'premium' }
          ],
          value: true
        }
      ]
    }
  }
});

// Evaluate a boolean flag
const result = client.getBool('dark-mode', {
  userId: 'user-123',
  attributes: { plan: 'premium' }
});

console.log(result.value);  // true
console.log(result.reason); // 'rule_match'

// Evaluate a variant flag
const layout = client.getVariant('pricing-layout', {
  userId: 'user-123',
  attributes: { country: 'US' }
});

console.log(layout.value); // 'layout-a', 'layout-b', or 'control'

// Clean up when done
client.close();
```

## API Reference

### `createFlagClient(options)`

Creates a new flag client instance.

**Options:**

- `apiUrl` (string, optional): API URL for fetching flag configuration
- `apiKey` (string, optional): API key for authentication
- `staticConfig` (FlagConfig, optional): Static configuration (alternative to API)
- `refreshInterval` (number, optional): Interval in milliseconds for refreshing config (default: 30000)
- `enableRefresh` (boolean, optional): Enable automatic config refresh (default: true)
- `timeout` (number, optional): Timeout for API requests in milliseconds (default: 5000)

**Returns:** `Promise<FlagClient>`

### `FlagClient`

#### `getBool(flagKey, context): EvaluationResult<boolean>`

Evaluates a boolean feature flag.

**Parameters:**

- `flagKey` (string): The flag key to evaluate
- `context` (Context): User context with optional userId and attributes

**Returns:** Evaluation result with boolean value and reason

#### `getVariant(flagKey, context): EvaluationResult<string>`

Evaluates a variant feature flag.

**Parameters:**

- `flagKey` (string): The flag key to evaluate
- `context` (Context): User context with optional userId and attributes

**Returns:** Evaluation result with variant key (string) and reason

#### `refresh(): Promise<void>`

Manually refreshes the configuration from the API.

#### `close(): void`

Closes the client and stops any refresh timers.

#### `hasFlag(flagKey): boolean`

Checks if a flag exists in the configuration.

#### `getFlagKeys(): string[]`

Returns all flag keys in the configuration.

#### `getConfig(): FlagConfig`

Returns the current flag configuration.

#### `isReady(): boolean`

Checks if the client is initialized and ready.

## Context

The context object is used to evaluate flags based on user attributes:

```typescript
interface Context {
  userId?: string;  // For rollout bucketing
  attributes: Record<string, unknown>;  // Custom attributes
}
```

**Examples:**

```typescript
// Simple context
const result = client.getBool('feature', {
  attributes: { plan: 'premium' }
});

// With userId for rollouts
const result = client.getBool('beta-feature', {
  userId: 'user-123',
  attributes: { country: 'US', plan: 'free' }
});
```

## Evaluation Reasons

The evaluation result includes a reason indicating why a particular value was returned:

- `'default'`: No rules matched, using default value
- `'rule_match'`: A rule matched and was applied
- `'rollout'`: User is included in percentage rollout
- `'rollout_excluded'`: User is excluded from percentage rollout
- `'flag_not_found'`: Flag key doesn't exist in configuration
- `'error'`: Error during evaluation

## Advanced Usage

### Custom Fetch Function

```typescript
import fetch from 'node-fetch';

const client = await createFlagClient({
  apiUrl: 'https://api.togglekit.com',
  apiKey: 'your-api-key',
  fetchFn: fetch as any
});
```

### Disable Automatic Refresh

```typescript
const client = await createFlagClient({
  apiUrl: 'https://api.togglekit.com',
  apiKey: 'your-api-key',
  enableRefresh: false
});

// Manually refresh when needed
await client.refresh();
```

### Error Handling

```typescript
try {
  const client = await createFlagClient({
    apiUrl: 'https://api.togglekit.com',
    apiKey: 'invalid-key'
  });
} catch (error) {
  console.error('Failed to initialize client:', error);
}

// Evaluation never throws - returns safe defaults
const result = client.getBool('non-existent', { attributes: {} });
console.log(result.value); // false
console.log(result.reason); // 'flag_not_found'
```

## TypeScript

This package is written in TypeScript and includes full type definitions.

```typescript
import {
  createFlagClient,
  FlagClient,
  FlagClientOptions,
  Context,
  EvaluationResult,
  FlagConfig
} from '@togglekit/flags-client-node';
```

## License

MIT

