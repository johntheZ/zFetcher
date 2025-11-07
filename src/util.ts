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