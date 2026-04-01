import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - items don't change often
      gcTime: 1000 * 60 * 10,   // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Centralized query keys — single source of truth
export const queryKeys = {
  items: {
    all: ['items'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
} as const;
