// 앱 전역 프로바이더 컴포넌트: React Query, 에러 바운더리 등 전역 설정
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'  // React Query 관련
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'  // React Query 개발 도구
import { Toaster } from 'sonner'  // 토스트 알림 라이브러리
import { type ReactNode, Suspense } from 'react'  // React 타입 및 컴포넌트
import ErrorBoundary from '@/shared/ui/ErrorBoundary'  // 에러 바운더리 컴포넌트

// React Query 클라이언트 설정: 전역 쿼리 기본 옵션
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,              // 네트워크 에러 3회 자동 재시도
      staleTime: 1000 * 60, // 1분 동안 데이터 신선 유지
    },
  },
})

// 앱 프로바이더 props 타입: 자식 컴포넌트 타입
interface AppProvidersProps {
  children: ReactNode  // 자식 컴포넌트
}

/**
 * 앱 전역 프로바이더 컴포넌트
 * 
 * 기능:
 * - React Query 클라이언트 제공
 * - 전역 에러 바운더리 설정
 * - Suspense 로딩 상태 처리
 * - 토스트 알림 설정
 * - 개발 도구 연동
 * 
 * 구조:
 * - QueryClientProvider: React Query 클라이언트
 * - ErrorBoundary: 전역 에러 처리
 * - Suspense: 비동기 컴포넌트 로딩
 * - Toaster: 토스트 알림
 * - ReactQueryDevtools: 개발 도구
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {/* Suspense: 비동기 컴포넌트 로딩 상태 처리 */}
        <Suspense fallback={<div className="flex items-center justify-center h-screen">로딩 중...</div>}>
          {children}
        </Suspense>
      </ErrorBoundary>

      {/* 토스트 알림 컴포넌트 */}
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
