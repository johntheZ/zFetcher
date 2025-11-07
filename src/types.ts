/**
 * Supported request protocols.
 */
export type RequestProtocol = "http" | "https" | "ws" | "wss" | "data" | "file";

/**
 * Supported HTTP request methods.
 */
export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Configuration options for initializing a ZFetcher instance.
 */
export interface ZFetcherConfig {
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
     * Headers that will always be attached to each request unless explicitly disabled.
     */
    headers?: Record<string, string>;

    /**
     * Query parameters that will always be appended to each request unless explicitly disabled.
     */
    queryParams?: Record<string, string | number | boolean | any>;

    /**
     * Default Fetch API options applied to every request unless explicitly disabled.
     * @default  credentials: "include" 
     */
    fetchOptions?: RequestInit;

    // --- Default Lifecycle Hooks ---

    /**
     * Invoked before the request is sent.
     * Useful for logging, modifying headers, or preparing data.
     * Can be disabled
     */
    onPrep?: () => Promise<void> | void;

    /**
     * Invoked when the request completes successfully (HTTP 2xx).
     * Can be disabled
     */
    onSuccess?: (response: Response) => Promise<void> | void;

    /**
     * Invoked when the response status is not OK (non-2xx).
     * Can be disabled
     */
    onNotOk?: (response: Response) => Promise<void> | void;

    /**
     * Invoked when an error occurs during the request or response handling.
     * Returning a value will prevent the error from being thrown further.
     * Can be disabled
     */
    onError?: (error: any) => Promise<any> | any;

    /**
     * Invoked after the request lifecycle completes, regardless of outcome.
     * Can be disabled
     */
    onSettled?: () => Promise<void> | void;
}

/**
 * Options for individual ZFetcher requests.
 */
export interface ZFetcherOptions {
    /**
     * The request body payload. Can be any valid JSON or raw data.
     */
    body?: any;

    /**
     * The delay (in milliseconds) before executing the request.
     */
    delay?: number;

    /**
     * Whether to disable default fetch options defined in `ZFetcherConfig`.
     */
    disableDefaultFetchOptions?: boolean;

    /**
     * Whether to disable default headers defined in `ZFetcherConfig`.
     */
    disableDefaultHeaders?: boolean;

    /**
     * Whether to disable default query parameters defined in `ZFetcherConfig`.
     */
    disableDefaultQueryParams?: boolean;

    disableDefaultOnPrep?: boolean;
    disableDefaultOnSuccess?: boolean;
    disableDefaultOnNotOk?: boolean;
    disableDefaultOnError?: boolean;
    disableDefaultOnSettled?: boolean;

    /**
     * Optional endpoint path appended to the base URL.
     */
    endpoint?: string;

    /**
     * Additional fetch options for this request.
     */
    fetchOptions?: RequestInit;

    /**
     * Additional headers for this specific request.
     */
    headers?: Record<string, string>;

    /**
     * IP address to target instead of using the default domain.
     */
    ip?: string;

    /**
     * HTTP request method.
     * @default "GET"
     */
    method?: RequestMethod;

    /**
     * Enables mock mode to bypass real network requests.
     */
    mock?: boolean;

    /**
     * The mock data to return when `mock` mode is enabled.
     */
    mockData?: any;

    /**
     * The mock data to return when `mock` mode is enabled.
     */
    mockResponse?: Response;

    /**
     * Port number to use when forming the request URL.
     */
    port?: string;

    /**
     * The request protocol.
     */
    protocol?: RequestProtocol;

    /**
     * Query parameters specific to this request.
     */
    queryParams?: Record<string, any>;

    /**
     * The fully qualified URL to use for this request (overrides `endpoint` and `defaultUrl`).
     */
    url?: string;

    normalizeUrl?: string;

    // --- Lifecycle Hooks ---

    /**
     * Invoked before the request is sent.
     * Useful for logging, modifying headers, or preparing data.
     */
    onPrep?: () => Promise<void> | void;

    /**
     * Invoked when the request completes successfully (HTTP 2xx).
     */
    onSuccess?: (response: Response) => Promise<void> | void;

    /**
     * Invoked when the response status is not OK (non-2xx).
     */
    onNotOk?: (response: Response) => Promise<void> | void;

    /**
     * Invoked when an error occurs during the request or response handling.
     * Returning a value will prevent the error from being thrown further.
     */
    onError?: (error: any) => Promise<any> | any;

    /**
     * Invoked after the request lifecycle completes, regardless of outcome.
     */
    onSettled?: () => Promise<void> | void;
}