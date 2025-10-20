import { createZFetcher } from "zfetcher";

const apiFetcher = createZFetcher({
    baseUrl: "https://api.example.com",
    defaultHeaders: {
        "Authorization": "Bearer your-token-here"
    },
});