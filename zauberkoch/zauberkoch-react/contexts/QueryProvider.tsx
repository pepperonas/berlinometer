'use client';

import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Stale time: how long data stays fresh (5 minutes)
          staleTime: 5 * 60 * 1000,
          
          // Cache time: how long data stays in cache when not in use (10 minutes)
          gcTime: 10 * 60 * 1000,
          
          // Retry configuration
          retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors (client errors)
            if (error?.status >= 400 && error?.status < 500) {
              return false;
            }
            
            // Retry up to 3 times for other errors
            return failureCount < 3;
          },
          
          // Retry delay with exponential backoff
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          
          // Refetch on window focus (disabled for better UX in PWA)
          refetchOnWindowFocus: false,
          
          // Refetch on reconnect
          refetchOnReconnect: 'always',
          
          // Background refetch interval (5 minutes)
          refetchInterval: 5 * 60 * 1000,
        },
        mutations: {
          // Retry mutations once on network errors
          retry: (failureCount, error: any) => {
            if (error?.status >= 400 && error?.status < 500) {
              return false;
            }
            return failureCount < 1;
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// Custom hooks for common query patterns
export { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

export default QueryProvider;