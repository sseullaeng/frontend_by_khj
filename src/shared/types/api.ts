// ── 백엔드 공통 응답 포맷 (백엔드 §4.3과 정합) ──────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

export interface ApiError {
  code: string
  message: string
  traceId: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// ── 비즈니스 에러 클래스 ────────────────────────────────────────────────────

export class BusinessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly traceId: string
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}
