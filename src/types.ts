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
     * Invoked before the request is sent.
     * Useful for logging
     */
    onPrep?: () => Promise<void> | void;

    /**
     * Invoked when the request completes successfully (HTTP 2xx).
     * Return a value to transform the response body.
     */
    onSuccess?: (response: Response, body: unknown) => Promise<unknown | void> | unknown | void;

    /**
     * Invoked when the response status is not OK (non-2xx).
     * Return a value to transform the response body.
     */
    onNotOk?: (response: Response, body: unknown) => Promise<unknown | void> | unknown | void;

    /**
     * Invoked when an error occurs during the request or response handling.
     * Return a value to prevent the error from being thrown and use that value as the response.
     */
    onError?: (error: unknown) => Promise<unknown> | unknown;

    /**
     * Invoked after the request lifecycle completes, regardless of outcome.
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
     * @default false
     */
    normalizeUrl?: boolean;

    /**
     * Throw ResponseError when response.ok is false.
     * @default true
     */
    throwNotOk?: boolean;

    /**
     * Headers that will always be attached to each request unless explicitly disabled.
     */
    headers?: Record<string, string>;

    /**
     * Query parameters that will always be appended to each request unless explicitly disabled.
     */
    queryParams?: Record<string, string | number | boolean | any>;

    /**
     * Default Fetch API options applied to every request unless explicitly disabled.
     * default { credentials: "include" }
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