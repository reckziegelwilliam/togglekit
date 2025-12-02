# @togglekit/flags-client-web

Web/Browser SDK for Togglekit feature flags with React support.

## Installation

```bash
npm install @togglekit/flags-client-web
# or
pnpm add @togglekit/flags-client-web
# or
yarn add @togglekit/flags-client-web
```

## Quick Start

### Basic Usage

```typescript
import { createFlagClient } from '@togglekit/flags-client-web';

// Bootstrap mode (synchronous, SSR-friendly)
const client = createFlagClient({
  bootstrapConfig: window.__FLAGS_CONFIG__
});

// Or fetch from API (async)
const client = await createFlagClient({
  apiUrl: 'https://api.togglekit.com',
  apiKey: 'your-api-key'
});

// Evaluate flags
const result = client.getBool('dark-mode', {
  attributes: { theme: 'auto' }
});

if (result.value) {
  // Enable dark mode
}
```

### React Usage

```typescript
import { createFlagClient } from '@togglekit/flags-client-web';
import { FlagProvider, useFlag, useFlagVariant } from '@togglekit/flags-client-web/react';

// Create client
const client = createFlagClient({
  bootstrapConfig: window.__FLAGS_CONFIG__
});

// Wrap your app
function App() {
  return (
    <FlagProvider client={client}>
      <MyComponent />
    </FlagProvider>
  );
}

// Use hooks in components
function MyComponent() {
  const darkMode = useFlag('dark-mode', {
    attributes: { theme: 'auto' }
  });

  const layout = useFlagVariant('pricing-layout', {
    attributes: { country: 'US' }
  });

  return (
    <div className={darkMode.value ? 'dark' : 'light'}>
      {layout.value === 'layout-a' ? <LayoutA /> : <LayoutB />}
    </div>
  );
}
```

## API Reference

### `createFlagClient(options)`

Creates a new web flag client instance.

**Options:**

- `bootstrapConfig` (FlagConfig, optional): Inline configuration for synchronous initialization
- `apiUrl` (string, optional): API URL for fetching flag configuration
- `apiKey` (string, optional): API key for authentication
- `enableRefresh` (boolean, optional): Enable automatic background refresh (default: false)
- `refreshInterval` (number, optional): Interval in milliseconds for refreshing config (default: 60000)
- `timeout` (number, optional): Timeout for API requests in milliseconds (default: 5000)

**Returns:** `WebFlagClient` (if bootstrap) or `Promise<WebFlagClient>` (if API fetch)

### `WebFlagClient`

#### `getBool(flagKey, context): EvaluationResult<boolean>`

Evaluates a boolean feature flag.

#### `getVariant(flagKey, context): EvaluationResult<string>`

Evaluates a variant feature flag.

#### `updateConfig(config): void`

Manually updates the client configuration. Triggers re-renders for React components.

#### `onConfigUpdate(listener): () => void`

Subscribes to config update events. Returns an unsubscribe function.

```typescript
const unsubscribe = client.onConfigUpdate(() => {
  console.log('Config updated!');
});

// Later...
unsubscribe();
```

#### `refresh(): Promise<void>`

Manually refreshes configuration from the API.

#### `close(): void`

Closes the client and stops any refresh timers.

#### `hasFlag(flagKey): boolean`

Checks if a flag exists.

#### `getFlagKeys(): string[]`

Returns all flag keys.

#### `getConfig(): FlagConfig`

Returns the current configuration.

#### `isReady(): boolean`

Checks if the client is initialized.

## React Hooks

### `useFlag(flagKey, context?)`

Hook to evaluate a boolean feature flag.

```typescript
function MyComponent() {
  const darkMode = useFlag('dark-mode', {
    attributes: { theme: 'auto' }
  });

  return <div>{darkMode.value ? 'Dark' : 'Light'}</div>;
}
```

### `useFlagVariant(flagKey, context?)`

Hook to evaluate a variant feature flag.

```typescript
function PricingPage() {
  const layout = useFlagVariant('pricing-layout', {
    userId: 'user-123',
    attributes: { country: 'US' }
  });

  switch (layout.value) {
    case 'layout-a':
      return <LayoutA />;
    case 'layout-b':
      return <LayoutB />;
    default:
      return <DefaultLayout />;
  }
}
```

### `useFlagKeys()`

Hook to get all flag keys (useful for debugging).

```typescript
function FlagList() {
  const flagKeys = useFlagKeys();
  return (
    <ul>
      {flagKeys.map(key => <li key={key}>{key}</li>)}
    </ul>
  );
}
```

### `useFlagExists(flagKey)`

Hook to check if a flag exists.

```typescript
function FeatureGate() {
  const hasNewFeature = useFlagExists('new-feature');
  
  if (!hasNewFeature) {
    return null;
  }

  return <NewFeature />;
}
```

## Server-Side Rendering (SSR)

### Next.js Example

```typescript
// pages/_app.tsx
import { createFlagClient } from '@togglekit/flags-client-web';
import { FlagProvider } from '@togglekit/flags-client-web/react';

function MyApp({ Component, pageProps }) {
  // Create client with bootstrapped config from getServerSideProps
  const client = createFlagClient({
    bootstrapConfig: pageProps.flagsConfig
  });

  return (
    <FlagProvider client={client}>
      <Component {...pageProps} />
    </FlagProvider>
  );
}

// pages/index.tsx
export async function getServerSideProps() {
  // Fetch flags on server
  const response = await fetch('https://api.togglekit.com/v1/config', {
    headers: {
      'Authorization': `Bearer ${process.env.TOGGLEKIT_API_KEY}`
    }
  });
  
  const flagsConfig = await response.json();

  return {
    props: {
      flagsConfig
    }
  };
}
```

## Context

```typescript
interface Context {
  userId?: string;  // For rollout bucketing
  attributes: Record<string, unknown>;  // Custom attributes
}
```

Context is optional - if not provided, only default values and rules without conditions will apply.

## Bootstrap vs API Fetch

### Bootstrap Mode (Recommended for SSR)

- Synchronous initialization
- Config loaded inline (from SSR, local storage, etc.)
- No network request on client initialization
- Optionally enable background refresh

```typescript
const client = createFlagClient({
  bootstrapConfig: window.__FLAGS_CONFIG__,
  // Optionally enable background refresh
  apiUrl: 'https://api.togglekit.com',
  apiKey: 'your-api-key',
  enableRefresh: true,
  refreshInterval: 120000  // Refresh every 2 minutes
});
```

### API Fetch Mode

- Asynchronous initialization
- Fetches config on client load
- Requires API credentials

```typescript
const client = await createFlagClient({
  apiUrl: 'https://api.togglekit.com',
  apiKey: 'your-api-key',
  enableRefresh: true
});
```

## Advanced Usage

### Dynamic Config Updates

```typescript
// Subscribe to updates
client.onConfigUpdate(() => {
  console.log('Flags updated!');
  // React components using hooks will automatically re-render
});

// Manually update config
client.updateConfig(newConfig);

// Or refresh from API
await client.refresh();
```

### Without React

The client works without React:

```typescript
const client = createFlagClient({
  bootstrapConfig: myConfig
});

// Listen for updates
client.onConfigUpdate(() => {
  updateUI();
});

function updateUI() {
  const result = client.getBool('dark-mode', { attributes: {} });
  document.body.classList.toggle('dark', result.value);
}
```

## TypeScript

Full TypeScript support included:

```typescript
import {
  createFlagClient,
  WebFlagClient,
  WebFlagClientOptions,
  Context,
  EvaluationResult,
  FlagConfig
} from '@togglekit/flags-client-web';

import {
  FlagProvider,
  FlagProviderProps,
  useFlag,
  useFlagVariant,
  useFlagKeys,
  useFlagExists
} from '@togglekit/flags-client-web/react';
```

## React Peer Dependency

React is an optional peer dependency. If you're not using React hooks, you don't need to install React.

```json
{
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  }
}
```

## License

MIT

