import { ZFetcherConfig, ZFetcherOptions } from "./types.js";
import { prepareRequestBody } from "./util.js";

export class ResponseError extends Error {
    readonly response: Response;
    readonly status: number;
    readonly statusText: string;
    readonly headers: Headers;
    readonly body?: unknown;

    constructor(response: Response, body?: unknown) {
        super("ResponseError");
        this.name = "ResponseError";
        this.response = response;
        this.status = response.status;
        this.statusText = response.statusText;
        this.headers = response.headers;
        this.body = body;

        Object.setPrototypeOf(this, ResponseError.prototype);
    }
}

export class NetworkError extends Error {
    readonly cause: unknown;
    readonly originalError: Error;

    constructor(message = "Network request failed", originalError: unknown) {
        super(message);
        this.name = "NetworkError";
        this.originalError = originalError as Error;
        this.cause = originalError;

        if (originalError instanceof Error) {
            this.stack = originalError.stack;
        }

        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

export function buildQueryString(query: Record<string, any> = {}): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;

        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
        } else if (typeof value === "object") {
            searchParams.append(key, JSON.stringify(value));
        } else {
            searchParams.append(key, String(value));
        }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

export function buildUrl(base: string, endpoint?: string, query?: string): string {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedEndpoint = endpoint?.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${normalizedBase}${normalizedEndpoint}${query || ""}`;
}

export function createZFetcher(config: ZFetcherConfig) {
    const {
        url: defaultUrl = "",
        headers: defaultHeaders,
        queryParams: defaultQueryParams,
        fetchOptions: defaultFetchOptions = {
            credentials: 'include'
        },
        normalizeUrl: defaultNormalizeUrl,
        throwNotOk: defaultThrowNotOk = true,
        onPrep: defaultOnPrep,
        onSuccess: defaultOnSuccess,
        onError: defaultOnError,
        onNotOk: defaultOnNotOk,
        onSettled: defaultOnSettled,
    } = config;

    async function fetcher<T = unknown>(endpoint: string = "", options?: ZFetcherOptions): Promise<T | unknown> {
        const {
            method = "GET",
            headers,
            queryParams,
            body,

            delay,
            mockFn,
            fetchOptions,

            url,
            normalizeUrl,
            throwNotOk,
            protocol,
            ip,
            port,

            disableDefaultHeaders,
            disableDefaultQueryParams,
            disableDefaultFetchOptions,
            disableDefaultOnPrep,
            disableDefaultOnSuccess,
            disableDefaultOnNotOk,
            disableDefaultOnError,
            disableDefaultOnSettled,

            onPrep,
            onSuccess,
            onNotOk,
            onError,
            onSettled,
        } = options || {};

        const shouldThrowNotOk = throwNotOk !== undefined ? throwNotOk : defaultThrowNotOk;

        const mergedHeaders = {
            ...(disableDefaultHeaders ? {} : defaultHeaders),
            ...headers,
        }
        const mergedFetchOptions = {
            ...(disableDefaultFetchOptions ? {} : defaultFetchOptions),
            ...fetchOptions,
        }
        const mergedQueryParams = {
            ...(disableDefaultQueryParams ? {} : defaultQueryParams),
            ...queryParams,
        };

        const queryString = buildQueryString(mergedQueryParams);

        let fullUrl = url || defaultUrl + endpoint + queryString;
        if (normalizeUrl || defaultNormalizeUrl) {
            fullUrl = buildUrl(url || defaultUrl, endpoint, queryString)
        }

        let response: Response | undefined;
        let processedBody: unknown;

        if (defaultOnPrep && !disableDefaultOnPrep) await defaultOnPrep();
        if (onPrep) await onPrep();

        if (delay) await new Promise((res) => setTimeout(res, delay));

        try {
            if (mockFn) {
                response = await mockFn()
            } else {
                response = await fetch(fullUrl, {
                    method,
                    headers: mergedHeaders,
                    ...(method !== "GET" && body && {
                        body: prepareRequestBody(body),
                    }),
                    ...mergedFetchOptions
                });
            }
        } catch (err: unknown) {
            let onErrorRet;
            let defaultOnErrorRet;
            if (onError) {
                onErrorRet = await onError(err);
            }
            if (defaultOnError && !disableDefaultOnError) {
                defaultOnErrorRet = await defaultOnError(err);
            }

            if (defaultOnSettled && !disableDefaultOnSettled) await defaultOnSettled();
            if (onSettled) await onSettled();

            if (onErrorRet !== undefined) return onErrorRet;
            if (defaultOnErrorRet !== undefined) return defaultOnErrorRet;
            throw new NetworkError("Network request failed", err);
        }

        const contentLength = response.headers.get("content-length");
        if (response.status === 204 || contentLength === "0") {
            processedBody = null;
        } else {
            const contentType = response.headers.get("content-type");
            processedBody = contentType && contentType.toLowerCase().includes("json")
                ? await response.json()
                : await response.text();
        }

        const beforeHandle = processedBody;
        if (response.ok) {
            if (defaultOnSuccess && !disableDefaultOnSuccess) {
                const handledValue = await defaultOnSuccess(response, beforeHandle);
                if (handledValue !== undefined) {
                    processedBody = handledValue
                }
            }
            if (onSuccess) {
                const handledValue = await onSuccess(response, beforeHandle);
                if (handledValue !== undefined) {
                    processedBody = handledValue
                }
            }
        } else {
            if (defaultOnNotOk && !disableDefaultOnNotOk) {
                const handledValue = await defaultOnNotOk(response, beforeHandle);
                if (handledValue !== undefined) {
                    processedBody = handledValue
                }
            }
            if (onNotOk) {
                const handledValue = await onNotOk(response, beforeHandle);
                if (handledValue !== undefined) {
                    processedBody = handledValue
                }
            }
        }

        if (defaultOnSettled && !disableDefaultOnSettled) await defaultOnSettled();
        if (onSettled) await onSettled();

        if (!response.ok && shouldThrowNotOk) {
            throw new ResponseError(response, processedBody)
        }

        return processedBody;
    }

    return {
        fetch: fetcher,
        get<T = any>(endpoint: string, options?: Omit<ZFetcherOptions, 'method'>) {
            return fetcher<T>(endpoint, { ...options, method: 'GET' })
        },
        post<T = any>(endpoint: string, options?: Omit<ZFetcherOptions, 'method'>) {
            return fetcher<T>(endpoint, { ...options, method: 'POST' })
        },
        put<T = any>(endpoint: string, options?: Omit<ZFetcherOptions, 'method'>) {
            return fetcher<T>(endpoint, { ...options, method: 'PUT' })
        },
        patch<T = any>(endpoint: string, options?: Omit<ZFetcherOptions, 'method'>) {
            return fetcher<T>(endpoint, { ...options, method: 'PATCH' })
        },
        delete<T = any>(endpoint: string, options?: Omit<ZFetcherOptions, 'method'>) {
            return fetcher<T>(endpoint, { ...options, method: 'DELETE' })
        },
    };
}

// onPrep returns nothing.
// onSettled returns nothing.
// onSuccess takes: original response obj, parsed response body
// onNotOk takes: original response obj, parsed response body
// onError takes: NetworkError obj,

/**
 * Case 1: Response with 2xx,
 * 
 * onPrep, onSuccess, onSettled will run.
 * 
 * onSuccess takes:
 *  original response obj,
 *  parsed response body
 * 
 * Fetcher return either:
 *  parsed response body,
 *  whatever onSuccess returns
 * 
 * Fetcher throw error:
 *  Never
 */

/**
 * Case 2: Response with non-2xx,
 * 
 * onPrep, onNotOk, onSettled will run.
 * 
 * onNotOk takes:
 *  original response obj,
 *  parsed response body
 * 
 * Fetcher return (`throwOnNotOk = false`) either:
 *  parsed response body,
 *  whatever onNotOk returns,
 * 
 * Fetcher throw error (`throwOnNotOk = true`):
 *  ResponseError
 */


/**
 * Case 3: Fetch throws Error
 * 
 * onPrep, onError, onSettled will run.
 * 
 * onError takes:
 *  NetworkError obj,
 * 
 * Fetcher return (onError returns):
 *  whatever onError returns
 * 
 * Fetcher throw error (onError does not handle, i.e returns undefine):
 *  NetworkError
 */