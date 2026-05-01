// 에러 바운더리 컴포넌트: React 애플리케이션의 에러를 잡아서 처리하는 클래스 컴포넌트
import { Component, type ReactNode, type ErrorInfo } from 'react'  // React 타입들

// 에러 바운더리 상태 인터페이스
interface ErrorBoundaryState {
  hasError: boolean      // 에러 발생 여부
  error: Error | null   // 발생한 에러 객체
}

// 에러 바운더리 Props 인터페이스
interface ErrorBoundaryProps {
  children: ReactNode   // 자식 컴포넌트들
  fallback?: ReactNode   // 커스텀 에러 화면 (선택사항)
}

/**
 * 에러 바운더리 컴포넌트
 * React 애플리케이션에서 발생하는 자바스크립트 에러를 잡아서 처리합니다.
 * 
 * 기능:
 * - 자식 컴포넌트에서 발생하는 에러 캐치
 * - 에러 발생 시 사용자 친화적인 에러 화면 표시
 * - 에러 정보 콘솔 로깅
 * - 페이지 새로고침 버튼 제공
 * - 커스텀 fallback UI 지원
 * 
 * 사용법:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * <ErrorBoundary fallback={<CustomError />}>
 *   <SomeComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    // 초기 상태: 에러 없음
    this.state = { hasError: false, error: null }
  }

  // 정적 메서드: 에러 발생 시 상태 업데이트
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  // 생명주기 메서드: 에러 발생 시 로깅
  componentDidCatch(error: Error, info: ErrorInfo) {
    // 에러 정보를 콘솔에 로깅 (개발 환경에서 디버깅용)
    console.error('[ErrorBoundary]', error, info)
  }

  // 렌더링 메서드: 에러 상태에 따라 다른 UI 렌더링
  render() {
    // 에러가 발생한 경우
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 해당 UI 렌더링
      if (this.props.fallback) return this.props.fallback

      // 기본 에러 화면 렌더링
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          {/* 에러 제목 */}
          <h1 className="text-2xl font-bold text-gray-900">오류가 발생했어요</h1>
          
          {/* 에러 설명 */}
          <p className="text-gray-500 text-sm max-w-sm">
            예상치 못한 오류가 발생했어요. 페이지를 새로고침해 주세요.
          </p>
          
          {/* 에러 메시지 표시 (개발 환경에서 디버깅용) */}
          {this.state.error && (
            <p className="text-xs text-gray-400 font-mono bg-gray-100 px-3 py-1 rounded">
              {this.state.error.message}
            </p>
          )}
          
          {/* 페이지 새로고침 버튼 */}
          <button
            onClick={() => window.location.reload()}  // 페이지 새로고침
            className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
          >
            새로고침
          </button>
        </div>
      )
    }

    // 에러가 없으면 자식 컴포넌트들 정상 렌더링
    return this.props.children
  }
}
