import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { type ReactNode, Suspense } from 'react'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 네트워크 에러 3회 자동 재시도
      retry: 3,
      staleTime: 1000 * 60, // 1분
    },
  },
})

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Suspense fallback={<div className="flex items-center justify-center h-screen">로딩 중...</div>}>
          {children}
        </Suspense>
      </ErrorBoundary>

      {/* 토스트 알림 */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={4000}
      />

      {/* 개발 환경 전용 React Query 디버그 패널 */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
