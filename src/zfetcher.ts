import { ZFetcherConfig, ZFetcherOptions } from "./types.js";

export function createZFetcher(config: ZFetcherConfig) {
    const { baseUrl, defaultHeaders = {}, defaultQuery = {} } = config;

    async function fetcher<T = any>(options: ZFetcherOptions): Promise<T | string> {
        const {
            endpoint = "",
            method = "GET",
            query,
            data,
            headers,
            onPrep,
            onSuccess,
            onNotOk,
            onError,
            onFinally,
            mock = false,
            delay,
            fetchOptions,
        } = options;

        const mergedQuery = { ...defaultQuery, ...query };
        const queryString = mergedQuery
            ? (() => {
                const filteredEntries = Object.entries(mergedQuery).filter(
                    ([, value]) => value !== undefined
                );
                return filteredEntries.length > 0
                    ? "?" + new URLSearchParams(filteredEntries as [string, string][]).toString()
                    : "";
            })()
            : "";

        const fullUrl = `${baseUrl}${endpoint}${queryString}`;
        // const fullUrl = `${baseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}${queryString}`;

        try {
            if (onPrep) await onPrep();

            if (delay) await new Promise((res) => setTimeout(res, delay));

            if (mock) {
                const fake = { mock: true, data: "fake response" } as T;
                const response = new Response(JSON.stringify(fake), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
                if (onSuccess) await onSuccess(response);
                return fake;
            }

            const isFormData = data instanceof FormData;

            const response = await fetch(fullUrl, {
                method,
                headers: {
                    ...(isFormData ? {} : { "Content-Type": "application/json" }),
                    ...defaultHeaders,
                    ...headers,
                },
                ...(method !== "GET" && data && {
                    body: isFormData ? data : JSON.stringify(data),
                }),
                credentials: "include",
                ...fetchOptions,
            });

            if (!response.ok) {
                if (onNotOk) await onNotOk(response);
                throw { type: "server", response };
            }

            if (onSuccess) await onSuccess(response);

            const contentLength = response.headers.get("content-length");
            if (contentLength === "0" || response.status === 204) return "" as any;

            const contentType = response.headers.get("content-type");
            return contentType && contentType.includes("application/json")
                ? await response.json()
                : await response.text();
        } catch (err: any) {
            if (onError) await onError(err);
            throw err;
        } finally {
            if (onFinally) await onFinally();
        }
    }

    return { fetch: fetcher };
}