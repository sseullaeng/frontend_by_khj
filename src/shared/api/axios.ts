// Axios HTTP 클라이언트 설정: API 요청을 위한 공통 인스턴스 및 인터셉터 설정
/**
 * 주요 기능:
 * - withCredentials: true (쿠키 자동 전송으로 인증 처리)
 * - Request interceptor: XSRF-TOKEN 쿠키를 X-XSRF-TOKEN 헤더로 자동 변환
 * - Response interceptor: 
 *     ① ApiResponse.success=false 시 BusinessError 예외 발생
 *     ② AUTH_TOKEN_EXPIRED 에러 시 토큰 자동 갱신 후 원 요청 재시도
 */

import axios, { type AxiosRequestConfig } from 'axios'  // HTTP 클라이언트 라이브러리
import { BusinessError } from '@/shared/types/api'     // 비즈니스 에러 타입

// 쿠키 읽기 헬퍼 함수: 지정된 이름의 쿠키 값을 반환
function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')                    // 세미콜론으로 쿠키 분리
    .find((row) => row.startsWith(`${name}=`))  // 이름으로 시작하는 쿠키 찾기
    ?.split('=')[1]                  // 값 부분만 추출
}

// 단일 in-flight refresh Promise: 여러 요청이 동시에 토큰 갱신을 시도하는 race condition 방지
let refreshPromise: Promise<void> | null = null

// 토큰 갱신 함수: 중복 호출 방지를 위해 단일 Promise 사용
async function refreshOnce(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/api/v1/auth/refresh')  // 토큰 갱신 API 호출
      .then(() => {
        refreshPromise = null        // 성공 시 Promise 초기화
      })
      .catch((err) => {
        refreshPromise = null        // 실패 시 Promise 초기화
        throw err                     // 에러 다시 발생
      })
  }
  return refreshPromise
}

// Axios 인스턴스 생성: API 요청을 위한 기본 설정
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',  // API 기본 URL (환경 변수에서 가져옴)
  withCredentials: true,                        // 쿠키 자동 전송 활성화
  timeout: 15_000,                              // 15초 타임아웃
})

// Request interceptor: 모든 요청에 CSRF 토큰 헤더 자동 추가
api.interceptors.request.use((config) => {
  const csrf = readCookie('XSRF-TOKEN')  // CSRF 토큰 쿠키 읽기
  if (csrf) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf)  // 헤더에 토큰 추가
  return config
})

// Response interceptor: 응답 처리 및 에러 핸들링
api.interceptors.response.use(
  // 성공 응답 처리
  (response) => {
    const body = response.data
    
    // ApiResponse 래핑 형태인 경우 처리 (서버에서 {success, data, error} 형태로 응답)
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) {
        // 비즈니스 에러 발생 (서버 로직 에러)
        throw new BusinessError(
          body.error.code,        // 에러 코드
          body.error.message,     // 에러 메시지
          body.error.traceId      // 추적 ID
        )
      }
      // 성공 시: data 필드만 추출하여 반환 (unwrap)
      response.data = body.data
    }
    return response
  },
  // 에러 응답 처리
  async (error) => {
    const originalConfig: AxiosRequestConfig & { _retry?: boolean } =
      error.config ?? {}
    const code: string | undefined = error.response?.data?.error?.code

    // 401 + AUTH_TOKEN_EXPIRED 에러 시 토큰 갱신 후 원 요청 재시도 (1회만)
    if (code === 'AUTH_TOKEN_EXPIRED' && !originalConfig._retry) {
      originalConfig._retry = true  // 재시도 플래그 설정

      try {
        await refreshOnce()           // 토큰 갱신
        return api(originalConfig)    // 원래 요청 재시도
      } catch {
        // 토큰 갱신 실패 시 로그아웃 이벤트 발생 (authStore에서 처리)
        window.dispatchEvent(new Event('auth:logout'))
      }
    }

    // 라운드8: 정지/차단된 사용자 즉시 로그아웃
    //   AUTH_REFRESH_TOKEN_INVALID — 정지/차단 후 refresh 시도
    //   USER_BLOCKED — 차단된 사용자가 기존 AT 로 보호 endpoint 진입
    if (code === 'AUTH_REFRESH_TOKEN_INVALID' || code === 'USER_BLOCKED') {
      window.dispatchEvent(new Event('auth:logout'))
    }

    throw error  // 그 외 에러는 그대로 발생
  }
)

export default api
