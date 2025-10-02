import { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "./apiClient";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: ({ queryKey }) => apiRequest(queryKey.join("/")),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
