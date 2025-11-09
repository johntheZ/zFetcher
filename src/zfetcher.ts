import { ZFetcherConfig, ZFetcherOptions } from "./types.js";
import { buildQueryString, buildUrl, prepareRequestBody } from "./util.js";

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

export function createZFetcher(config: ZFetcherConfig) {
    const {
        url: defaultUrl = "",
        headers: defaultHeaders,
        queryParams: defaultQueryParams,
        fetchOptions: defaultFetchOptions = {
            credentials: 'include',
        },
        normalizeUrl: defaultNormalizeUrl = true,
        throwNotOk: defaultThrowNotOk = true,
        onPrep: defaultOnPrep,
        onSuccess: defaultOnSuccess,
        onError: defaultOnError,
        onNotOk: defaultOnNotOk,
        onSettled: defaultOnSettled,
    } = config;

    async function fetcher<T = any>(endpoint: string = "", options?: ZFetcherOptions): Promise<T | any> {
        const {
            method = "GET",
            headers,
            queryParams,
            body,

            delay,
            mockFn,
            fetchOptions,

            url = defaultUrl,
            normalizeUrl = defaultNormalizeUrl,
            throwNotOk = defaultThrowNotOk,
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

        if (defaultOnPrep && !disableDefaultOnPrep) await defaultOnPrep();
        if (onPrep) await onPrep();

        const mergedFetchOptions = {
            ...(disableDefaultFetchOptions ? {} : defaultFetchOptions),
            ...fetchOptions,
        }
        const mergedHeaders = {
            ...(disableDefaultHeaders ? {} : defaultHeaders),
            ...headers,
        }
        const mergedQueryParams = {
            ...(disableDefaultQueryParams ? {} : defaultQueryParams),
            ...queryParams,
        };

        const queryString = buildQueryString(mergedQueryParams);

        let fullUrl = normalizeUrl
            ? buildUrl(url, endpoint, queryString)
            : url + endpoint + queryString

        if (delay) await new Promise((res) => setTimeout(res, delay));

        let response: Response | undefined;
        let processedBody: unknown;

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
            try {
                if (onError) {
                    onErrorRet = await onError(err);
                }
                if (defaultOnError && !disableDefaultOnError) {
                    defaultOnErrorRet = await defaultOnError(err);
                }
            } finally {
                if (defaultOnSettled && !disableDefaultOnSettled) await defaultOnSettled();
                if (onSettled) await onSettled();
            }
            if (onErrorRet !== undefined) return onErrorRet;
            if (defaultOnErrorRet !== undefined) return defaultOnErrorRet;
            throw new NetworkError("Network request failed", err);
        }

        try {
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
        } finally {
            if (defaultOnSettled && !disableDefaultOnSettled) await defaultOnSettled();
            if (onSettled) await onSettled();
        }

        if (!response.ok && throwNotOk) {
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