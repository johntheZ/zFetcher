import { ZFetcherConfig, ZFetcherOptions } from "./types.js";
import { prepareRequestBody } from "./util.js";

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
        onPrep: defaultOnPrep,
        onSuccess: defaultOnSuccess,
        onError: defaultOnError,
        onNotOk: defaultOnNotOk,
        onSettled: defaultOnSettled,
    } = config;

    async function fetcher<T = any>(options: ZFetcherOptions): Promise<T | string> {
        const {
            endpoint = "",
            method = "GET",
            headers,
            queryParams,
            body,

            delay,
            mock,
            mockData,
            mockResponse,
            fetchOptions,

            url,
            normalizeUrl,
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
        } = options;

        const mergedQuery = {
            ...(disableDefaultQueryParams ? {} : defaultQueryParams),
            ...queryParams,
        };
        const queryString = buildQueryString(mergedQuery);

        let fullUrl = url || defaultUrl + endpoint + queryString;
        if (normalizeUrl || defaultNormalizeUrl) {
            fullUrl = buildUrl(url || defaultUrl, endpoint, queryString)
        }

        try {
            if (defaultOnPrep && !disableDefaultOnPrep) await defaultOnPrep();
            if (onPrep) await onPrep();

            if (delay) await new Promise((res) => setTimeout(res, delay));

            if (mock) {
                const res = mockResponse || new Response(JSON.stringify(mockData), {
                    status: 200, headers: {
                        "Content-Type": "application/json",
                    }
                })
                if (defaultOnSuccess && !disableDefaultOnSuccess) await defaultOnSuccess(res);
                if (onSuccess) await onSuccess(res);
                return mockData
            }

            const response = await fetch(fullUrl, {
                method,
                headers: {
                    ...(disableDefaultHeaders ? {} : defaultHeaders),
                    ...headers,
                },
                ...(method !== "GET" && body && {
                    body: prepareRequestBody(body),
                }),
                ...(disableDefaultFetchOptions ? {} : defaultFetchOptions),
                ...fetchOptions,
            });

            if (response.ok) {
                if (defaultOnSuccess && !disableDefaultOnSuccess) await defaultOnSuccess(response);
                if (onSuccess) await onSuccess(response);
            } else {
                if (defaultOnNotOk && !disableDefaultOnNotOk) await defaultOnNotOk(response);
                if (onNotOk) await onNotOk(response);
            }

            const contentLength = response.headers.get("content-length");
            if (response.status === 204 || contentLength === "0") return String(response.status);

            const contentType = response.headers.get("content-type");
            return contentType && contentType.includes("application/json")
                ? await response.json()
                : await response.text();
        } catch (err: any) {
            if (defaultOnError && !disableDefaultOnError) {
                const handledValue = await defaultOnError(err);
                if (handledValue !== undefined) return handledValue;
            }
            if (onError) {
                const handledValue = await onError(err);
                if (handledValue !== undefined) return handledValue;
            }
            throw err;
        } finally {
            if (defaultOnSettled && !disableDefaultOnSettled) await defaultOnSettled();
            if (onSettled) await onSettled();
        }
    }

    return {
        fetch: fetcher,
        get: <T = any>(options: Omit<ZFetcherOptions, 'method'>) =>
            fetcher<T>({ ...options, method: 'GET' }),
        post: <T = any>(options: Omit<ZFetcherOptions, 'method'>) =>
            fetcher<T>({ ...options, method: 'POST' }),
        put: <T = any>(options: Omit<ZFetcherOptions, 'method'>) =>
            fetcher<T>({ ...options, method: 'PUT' }),
        patch: <T = any>(options: Omit<ZFetcherOptions, 'method'>) =>
            fetcher<T>({ ...options, method: 'PATCH' }),
        delete: <T = any>(options: Omit<ZFetcherOptions, 'method'>) =>
            fetcher<T>({ ...options, method: 'DELETE' }),
    };
}