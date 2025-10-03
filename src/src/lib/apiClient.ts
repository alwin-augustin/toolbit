import { API_BASE_URL } from "../config";

async function handleApiResponse(res: Response) {
    if (!res.ok) {
        let errorMessage = res.statusText;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        } catch (_e) {
            // Ignore if the response is not JSON
        }
        throw new Error(`${res.status}: ${errorMessage}`);
    }
    return res.json();
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    return handleApiResponse(res);
}
