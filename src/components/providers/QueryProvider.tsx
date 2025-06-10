'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes
            staleTime: 1000 * 60 * 5,
            // Cache time: 10 minutes
            gcTime: 1000 * 60 * 10,
            // Retry failed requests 3 times
            retry: 3,
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus only if data is stale
            refetchOnWindowFocus: 'always',
            // Refetch on reconnect
            refetchOnReconnect: 'always',
            // Background refetch interval: 5 minutes
            refetchInterval: 1000 * 60 * 5,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            // Retry delay: 1 second
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}