// 인증 API: 로그인, 회원가입, 프로필 관리 등 인증 관련 API 호출
import api from '@/shared/api/axios'  // 기본 API 클라이언트
import type {
  LoginRequest,
  SignupRequest,
  LoginResponse,
  UpdateProfileRequest,
  OAuthLoginRequest,
} from './types'  // 인증 관련 타입
import type { User } from '@/shared/types'  // 사용자 타입

/**
 * 인증 API 객체
 * 
 * 기능:
 * - 로그인/로그아웃
 * - 회원가입
 * - 토큰 갱신
 * - 사용자 정보 조회
 * - 프로필 수정
 * - 파일 업로드 URL 생성
 * - 소셜 로그인 콜백
 */
export const authApi = {
  login:   (body: LoginRequest)  => api.post<LoginResponse>('/api/v1/auth/login', body),  // 로그인
  signup:  (body: SignupRequest) => api.post<void>('/api/v1/auth/signup', body),           // 회원가입
  logout:  ()                    => api.post<void>('/api/v1/auth/logout'),                 // 로그아웃
  refresh: ()                    => api.post<void>('/api/v1/auth/refresh'),               // 토큰 갱신
  me:      ()                    => api.get<User>('/api/v1/users/me'),                      // 현재 사용자 정보 조회

  updateProfile: (body: UpdateProfileRequest) =>
    api.patch<User>('/api/v1/users/me', body),  // 프로필 수정

  getPresignedUrl: (file: { name: string; contentType: string; size: number }) =>
    api.post<{ presignedUrl: string; key: string }>('/api/v1/files/presigned-url', {
      purpose: 'profile', files: [file],  // 프로필 이미지 업로드용 사인드 URL 생성
    }),

  // 소셜 로그인 (kakao/google 모두 redirect 흐름 — body { code, redirectUri })
  oauthLogin: (req: OAuthLoginRequest) => {
    const { provider, ...body } = req
    return api.post<LoginResponse>(`/api/v1/auth/oauth2/${provider}`, body)
  },

  // 이메일 인증 (메일 링크 → 프론트 페이지 → 이 API 호출)
  verifyEmail: (token: string) =>
    api.post<void>('/api/v1/auth/verify-email', { token }),

  // 인증 메일 재발송 (인증 필수, 60초 cooldown)
  resendVerification: () =>
    api.post<void>('/api/v1/auth/resend-verification'),
}
