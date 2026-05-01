// ── 백엔드 공통 응답 포맷 (백엔드 §4.3과 정합) ──────────────────────────────

// API 응답 타입: 성공/실패 여부와 데이터 포함
export type ApiResponse<T> =
  | { success: true; data: T }    // 성공 응답
  | { success: false; error: ApiError }  // 실패 응답

// API 에러 정보
export interface ApiError {
  code: string        // 에러 코드
  message: string     // 에러 메시지
  traceId: string    // 추적 ID
}

// 페이지네이션 응답 타입
export interface PageResponse<T> {
  content: T[]       // 데이터 목록
  page: number        // 현재 페이지
  size: number        // 페이지 크기
  totalElements: number  // 전체 요소 수
  totalPages: number    // 전체 페이지 수
  hasNext: boolean     // 다음 페이지 존재 여부
  hasPrevious: boolean // 이전 페이지 존재 여부
}

// ── 비즈니스 에러 클래스 ────────────────────────────────────────────────────

// 비즈니스 로직 에러 처리 클래스
export class BusinessError extends Error {
  constructor(
    public readonly code: string,      // 에러 코드
    message: string,               // 에러 메시지
    public readonly traceId: string  // 추적 ID
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}
