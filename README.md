# ZFetcher

A lightweight Fetch API wrapper with lifecycle hooks, error handling, and flexible configuration options.

## Features

- 🔄 **Lifecycle Hooks** - Pre-request, success, error, and settlement callbacks
- ⚡ **Flexible Configuration** - Global defaults with per-request overrides
- 🎭 **Mock Support** - Allow mocking response
- 🚨 **Error Handling** - Distinct error types for network vs HTTP errors
- 🔧 **Customizable** - Disable defaults, transform responses, and more

## Installation

```bash
npm install zfetcher
# or
bun add zfetcher
# or
yarn add zfetcher
# or
pnpm add zfetcher
```

## Quick Start

```typescript
import { createZFetcher } from 'zfetcher';

// Create a configured API client
const api = createZFetcher({
  url: 'https://api.example.com',
  headers: {
    Authorization: 'Bearer token123',
  },
});

const users = await api.get('/users');
const user1 = await api.get('/user', {
  queryParams: { id: 'usr_1' },
});
const newUser = await api.post('/users', {
  body: { name: 'John' },
  throwNotOk: false,
  onNotOk: (response, parsedBody) => {
    throw Error("Custom Error") // bypass `throwNotOk = false`
    // or
    console.log('non-2xx status', response.status)
    // or
    return getCachedValue()
  },
});
```

## Configuration

### Global Configuration

```typescript
const api = createZFetcher({
  url: 'https://api.example.com',
  normalizeUrl: true,
  throwNotOk: true,
  headers: {
    'Content-Type': 'application/json'
  },
  queryParams: {
    apiKey: 'your-api-key'
  },
  fetchOptions: {
    credentials: 'include'
  },
  // Lifecycle hooks
  onPrep: async () => {
    console.log('Request starting...');
  },
  onSuccess: async (response, body) => {
    console.log('Request succeeded:', response.status);
  },
  onNotOk: async (response, body) => {
    console.error('Request failed:', response.status);
  },
  onError: async (error) => {
    console.error('Network/Fetch API error:', error);
  },
  onSettled: async () => {
    console.log('Request completed');
  }
});
```

### Per-Request Options

```typescript
await api.post('/users', {
  body: { name: 'John' },
  headers: {
    'X-Custom-Header': 'value'
  },
  queryParams: {
    include: 'profile'
  },
  throwNotOk: false,
  delay: 1000, // Delay request by 1 second
  // disable default hooks
  disableDefaultOnSuccess: true,
  onSuccess: async (response, body) => {
    return { ...body, modified: true };
  }
});
```

## API Reference

### Methods

#### `createZFetcher(config: ZFetcherConfig)`

Creates a new ZFetcher instance with global configuration.

#### Instance Methods

- **`fetch<T>(endpoint: string, options?: ZFetcherOptions): Promise<T>`** - Generic fetch method
- **`get<T>(endpoint: string, options?: ZFetcherOptions): Promise<T>`** - GET request
- **`post<T>(endpoint: string, options?: ZFetcherOptions): Promise<T>`** - POST request
- **`put<T>(endpoint: string, options?: ZFetcherOptions): Promise<T>`** - PUT request
- **`patch<T>(endpoint: string, options?: ZFetcherOptions): Promise<T>`** - PATCH request
- **`delete<T>(endpoint: string, options?: ZFetcherOptions): Promise<T>`** - DELETE request

### Configuration Options

| Option         | Type                     | Default                      | Description                                 |
| -------------- | ------------------------ | ---------------------------- | ------------------------------------------- |
| `url`          | `string`                 | `""`                         | Base URL for all requests                   |
| `normalizeUrl` | `boolean`                | `true`                       | Automatically normalize URL slashes         |
| `throwNotOk`   | `boolean`                | `true`                       | Throw `ResponseError` for non-2xx responses |
| `headers`      | `Record<string, string>` | `undefined`                  | Default headers for all requests            |
| `queryParams`  | `Record<string, any>`    | `undefined`                  | Default query parameters                    |
| `fetchOptions` | `RequestInit`            | `{ credentials: 'include' }` | Default fetch options                       |

### Request Options

All configuration options plus:

| Option                       | Type                      | Description                          |
| ---------------------------- | ------------------------- | ------------------------------------ |
| `method`                     | `RequestMethod`           | HTTP method (GET, POST, etc.)        |
| `body`                       | `any`                     | Request body (auto-serialized)       |
| `delay`                      | `number`                  | Delay in milliseconds before request |
| `mockFn`                     | `() => Promise<Response>` | Mock function for testing            |
| `disableDefaultHeaders`      | `boolean`                 | Disable global headers               |
| `disableDefaultQueryParams`  | `boolean`                 | Disable global query params          |
| `disableDefaultFetchOptions` | `boolean`                 | Disable global fetch options         |
| `disableDefaultOn*`          | `boolean`                 | Disable specific global hooks        |

## 🪝 Lifecycle Hooks

ZFetcher provides **lifecycle hooks** that let you intercept, transform, and control the request and response flow at every stage.

---

### 🔄 Execution Flow

#### ✅ Case 1: Successful Response (2xx)
```
onPrep → onSuccess → onSettled → return
```
If `onSuccess` returns a value, that value **replaces** the original response body and becomes the final result.

#### ⚠️ Case 2: Failed Response (non-2xx)
```
onPrep → onNotOk → onSettled → throw / return
```
If `onNotOk` returns a value **and** `throwNotOk` is `false`, the returned value replaces the response body.  
If `onNotOk` **throws**, the thrown value **bypasses** `throwNotOk` and propagates directly.

#### ❌ Case 3: Network / Fetch API Error
```
onPrep → onError → onSettled → throw / return
```
If `onError` returns a value, it prevents the error from propagating.  
If `onError` returns `undefined`, the original error propagates.  
If `onError` **throws**, the thrown value propagates directly.

---

### 🧩 Hook Signatures

```typescript
/**
 * Called before the request is sent.
 */
onPrep?: () => Promise<void> | void;

/**
 * Called when the response is successful (2xx).
 * Returning a value replaces the original response body.
 * Throwing propagates immediately.
 */
onSuccess?: (response: Response, body: unknown) => Promise<unknown | void> | unknown | void;

/**
 * Called when the response is not OK (non-2xx).
 * Returning a value replaces the response body if `throwNotOk` is false.
 * Throwing bypasses `throwNotOk` and propagates immediately.
 */
onNotOk?: (response: Response, body: unknown) => Promise<unknown | void> | unknown | void;

/**
 * Called on network or Fetch API errors.
 * Returning a value prevents the error from propagating.
 * Returning `undefined` propagates the original error.
 */
onError?: (error: NetworkError) => Promise<unknown | void> | unknown | void;

/**
 * Always called after the request completes,
 * regardless of success, failure, or error.
 */
onSettled?: () => Promise<void> | void;
```

#### Example
```typescript
const fetcher = createZFetcher({
  url: "https://api.example.com",
  onPrep: () => console.log("Preparing request..."),
  onSuccess: async (_, body) => {
    console.log("✅ Success:", body);
    return { data: body, fetchedAt: Date.now() };
  },
  onNotOk: async (res, body) => {
    console.warn("⚠️ Non-2xx response:", res.status);
    if (res.status === 404) return { error: "Not found" };
    throw new Error("Request failed");
  },
  onError: (err) => {
    console.error("❌ Network error:", err);
    return { error: "Network unavailable", cached: true };
  },
  onSettled: () => console.log("Request finished."),
});
```

## Error Handling

ZFetcher provides two distinct error types:

### `ResponseError`

Thrown when the server responds with a non-2xx status code and `throwNotOk: true`.

```typescript
try {
  await api.get('/users/999', {throwNotOk: true});
} catch (error) {
  if (error instanceof ResponseError) {
    console.log(error.status);      // 404
    console.log(error.statusText);  // "Not Found"
    console.log(error.body);        // Parsed response body
    console.log(error.response);    // Original Response object
  }
}
```

### `NetworkError`

Thrown when the fetch request itself fails (network issues, CORS, timeout, etc.).

```typescript
try {
  await api.get('/users');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log(error.message);        // "Network request failed"
    console.log(error.originalError);  // Original error from fetch
    console.log(error.cause);          // Same as originalError
  }
}
```

### Preventing Errors from Being Thrown

#### For HTTP Errors
```typescript
// Option 1: Disable throwing globally
const api = createZFetcher({
  url: 'https://api.example.com',
  throwNotOk: false
});

// Option 2: Disable per-request
const response = await api.get('/users/999', { throwNotOk: false });

// Option 3: Handle in onNotOk hook
const api = createZFetcher({
  onNotOk: async (response, body) => {
    return { error: true, status: response.status };
  }
});
```

#### For Network Errors
```typescript
const api = createZFetcher({
  onError: async (error) => {
    // Return a value to prevent the error from being thrown
    return { error: true, message: error.message };
  }
});
```

## Advanced Usage

### Response Transformation

```typescript
const api = createZFetcher({
  url: 'https://api.example.com',
  onSuccess: async (response, body) => {
    // Transform all successful responses
    return {
      data: body,
      timestamp: Date.now()
    };
  }
});
```

### Request Mocking

```typescript
const user = await api.get('/users/1', {
  mockFn: async () => {
    return new Response(
      JSON.stringify({ id: 1, name: 'John' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Conditional Logic

```typescript
const api = createZFetcher({
  url: 'https://api.example.com',
  onNotOk: async (response, body) => {
    if (response.status === 401) {
      // Refresh token and retry
      await refreshToken();
      return { shouldRetry: true };
    }
  }
});
```

### Disabling Global/Default Behavior

```typescript
// Make a request without default headers/params
await api.get('/public-endpoint', {
  disableDefaultHeaders: true,
  disableDefaultQueryParams: true,
  disableDefaultOnSuccess: true
});
```

### URL Normalization

```typescript
const api = createZFetcher({
  url: 'https://api.example.com/',
  normalizeUrl: true
});

// These all result in: https://api.example.com/users/1
await api.get('users/1');
await api.get('/users/1');
await api.get('//users/1');
```

## TypeScript Support (***Not Yet***)

ZFetcher is written in TypeScript and provides full type safety:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Type-safe response
const user = await api.get<User>('/users/1');
console.log(user.name); // ✓ Type-checked

// Type-safe body
await api.post<User>('/users', {
  body: {
    name: 'John',
    email: 'john@example.com'
  }
});
```

## Best Practices

1. **Create separate instances for different APIs**
   ```typescript
   const userAPI = createZFetcher({ url: 'https://users.api.com' });
   const paymentAPI = createZFetcher({ url: 'https://payments.api.com' });
   ```

2. **Handle errors at the appropriate level**
   ```typescript
   // Global error handling
   const api = createZFetcher({
     onError: async (error) => {
       logToErrorService(error);
       showUserNotification('Network error occurred');
     }
   });

   await api.get('/critical-endpoint', {
    onNotOk: (response, body) => {
      if (body.err === "data conflict")
      showRequestFailed("This value already exists")
    }
   });
   ```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open an issue on GitHub.