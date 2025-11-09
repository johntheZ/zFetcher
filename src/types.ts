/**
 * Supported request protocols.
 */
export type RequestProtocol = "http" | "https" | "ws" | "wss" | "data" | "file";

/**
 * Supported HTTP request methods.
 */
export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Lifecycle hook handlers shared between config and options.
 */
export interface LifecycleHooks {
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
     * If `throwNotOk` is false, returning a value replaces the original response body
     * Throwing bypasses `throwNotOk` and propagates immediately.
     */
    onNotOk?: (response: Response, body: unknown) => Promise<unknown | void> | unknown | void;

    /**
     * Called on network or Fetch API errors.
     * Returning a value prevents the error from propagating.
     * Returning `undefined` propagates the original error.
     * Throwing propagates immediately.
     */
    onError?: (error: unknown) => Promise<unknown> | unknown;

    /**
     * Always called after the request completes,
     * regardless of success, failure, or error.
     */
    onSettled?: () => Promise<void> | void;
}

/**
 * Flags to disable default lifecycle hooks.
 */
export interface DisableDefaultHooks {
    disableDefaultOnPrep?: boolean;
    disableDefaultOnSuccess?: boolean;
    disableDefaultOnNotOk?: boolean;
    disableDefaultOnError?: boolean;
    disableDefaultOnSettled?: boolean;
}

/**
 * Configuration options for initializing a ZFetcher instance.
 */
export interface ZFetcherConfig extends LifecycleHooks {
    /**
     * The default base URL for all requests.
     */
    url?: string;

    /**
     * Automatically normalizes URLs by ensuring proper slashes.
     * If disabled, url, path, and query params are concatenated literally.
     * @default true
     */
    normalizeUrl?: boolean;

    /**
     * Throw ResponseError when response.ok is false.
     * @default true
     */
    throwNotOk?: boolean;

    /**
     * Headers attached to every request, can be disabled explicitly per request.
     */
    headers?: Record<string, string>;

    /**
     * Query parameters appended to every request, can be disabled explicitly per request.
     */
    queryParams?: Record<string, string | number | boolean | any>;

    /**
     * Default Fetch API options applied to every request, can be disabled explicitly per request.
     * @default { credentials: "include" }
     */
    fetchOptions?: Omit<RequestInit, 'headers'>;
}

/**
 * Options for individual ZFetcher requests.
 */
export interface ZFetcherOptions extends LifecycleHooks, DisableDefaultHooks {
    /**
     * HTTP request method.
     * @default "GET"
     */
    method?: RequestMethod;

    /**
     * The request body payload. Can be any valid JSON or raw data.
     */
    body?: any;

    /**
     * Additional headers for this specific request.
     */
    headers?: Record<string, string>;

    /**
     * Query parameters specific to this request.
     */
    queryParams?: Record<string, any>;

    /**
     * Additional fetch options for this request.
     */
    fetchOptions?: Omit<RequestInit, 'method' | 'headers' | 'body'>;

    /**
     * The fully qualified URL to use for this request (overrides base URL).
     */
    url?: string;

    /**
     * Automatically normalizes URLs by ensuring proper slashes.
     * Overrides the default normalizeUrl setting.
     */
    normalizeUrl?: boolean;

    /**
     * Throw ResponseError when response.ok is false.
     * Overrides the default throwNotOk setting.
     */
    throwNotOk?: boolean;

    /**
     * The delay (in milliseconds) before executing the request.
     */
    delay?: number;

    /**
     * Mock function to construct the response (for testing).
     * When provided, the actual fetch is skipped.
     */
    mockFn?: () => Promise<Response> | Response;

    /**
     * Whether to disable default fetch options defined in ZFetcherConfig.
     */
    disableDefaultFetchOptions?: boolean;

    /**
     * Whether to disable default headers defined in ZFetcherConfig.
     */
    disableDefaultHeaders?: boolean;

    /**
     * Whether to disable default query parameters defined in ZFetcherConfig.
     */
    disableDefaultQueryParams?: boolean;

    // --- Unused/Future features ---
    // These are kept for backward compatibility but not yet implemented

    /**
     * @deprecated Not yet implemented
     */
    protocol?: RequestProtocol;

    /**
     * @deprecated Not yet implemented
     */
    ip?: string;

    /**
     * @deprecated Not yet implemented
     */
    port?: string;
}