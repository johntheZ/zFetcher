/**
 * Normalize url
 */
export function buildUrl(base: string, endpoint?: string, query?: string): string {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedEndpoint = endpoint?.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${normalizedBase}${normalizedEndpoint}${query || ""}`;
}

/**
 * Build the request query string
 */
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



/**
 * Prepares the request body based on its type
 */
export function prepareRequestBody(body: any): BodyInit | null {
    if (!body) return null;

    // Special types pass through as-is
    if (
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof URLSearchParams ||
        body instanceof ReadableStream ||
        typeof body === 'string'
    ) {
        return body;
    }

    // Only serialize objects/arrays
    return JSON.stringify(body);
}