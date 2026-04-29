/**
 * Axios 인스턴스 설정
 *
 * - withCredentials: true  (쿠키 자동 전송)
 * - Request interceptor: XSRF-TOKEN 쿠키 → X-XSRF-TOKEN 헤더
 * - Response interceptor:
 *     ① ApiResponse.success=false → BusinessError throw
 *     ② AUTH_TOKEN_EXPIRED → /auth/refresh 단일 in-flight, 원 요청 재시도
 */

import axios, { type AxiosRequestConfig } from 'axios'
import { BusinessError } from '@/shared/types/api'

// ── 쿠키 읽기 헬퍼 ──────────────────────────────────────────────────────────
function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

// ── 단일 in-flight refresh Promise (race condition 방지) ────────────────────
let refreshPromise: Promise<void> | null = null

async function refreshOnce(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/api/v1/auth/refresh')
      .then(() => {
        refreshPromise = null
      })
      .catch((err) => {
        refreshPromise = null
        throw err
      })
  }
  return refreshPromise
}

// ── Axios 인스턴스 ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  withCredentials: true,
  timeout: 15_000,
})

// Request interceptor: CSRF 토큰 헤더 추가
api.interceptors.request.use((config) => {
  const csrf = readCookie('XSRF-TOKEN')
  if (csrf) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf)
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const body = response.data
    // ApiResponse 래핑 형태인 경우 처리
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) {
        throw new BusinessError(
          body.error.code,
          body.error.message,
          body.error.traceId
        )
      }
      // unwrap: data 만 반환
      response.data = body.data
    }
    return response
  },
  async (error) => {
    const originalConfig: AxiosRequestConfig & { _retry?: boolean } =
      error.config ?? {}
    const code: string | undefined = error.response?.data?.error?.code

    // 401 + AUTH_TOKEN_EXPIRED → 토큰 갱신 후 재시도 (1회)
    if (code === 'AUTH_TOKEN_EXPIRED' && !originalConfig._retry) {
      originalConfig._retry = true
      try {
        await refreshOnce()
        return api(originalConfig)
      } catch {
        // 갱신 실패 → 로그아웃 처리는 authStore에서 담당
        window.dispatchEvent(new Event('auth:logout'))
      }
    }

    throw error
  }
)

export default api
