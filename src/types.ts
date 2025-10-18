export type ZFetcherOptions = {
    endpoint?: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    query?: Record<string, string | number | boolean>;
    data?: any;
    headers?: Record<string, string>;
    onPrep?: () => Promise<void> | void;
    onSuccess?: (response: Response) => Promise<void> | void;
    onNotOk?: (response: Response) => Promise<void> | void;
    onError?: (error: any) => Promise<void> | void;
    onFinally?: () => Promise<void> | void;
    mock?: boolean;
    delay?: number;
    fetchOptions?: RequestInit;
};

export type ZFetcherConfig = {
    baseUrl: string;
    defaultHeaders?: Record<string, string>;
    defaultProtocol?: string;
    defaultQuery?: Record<string, string | number | boolean>;
};