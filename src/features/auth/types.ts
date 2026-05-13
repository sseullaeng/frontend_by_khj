// 인증 관련 타입: 로그인, 회원가입, 프로필 관리 등 인증 관련 데이터 타입 정의
import { z } from 'zod'  // Zod 스키마 라이브러리
import type { User } from '@/shared/types'  // 사용자 타입

// ── Zod 스키마: 폼 유효성 검증 ──────────────────────────────────────────────────────

/**
 * 로그인 스키마
 * 
 * 검증 항목:
 * - 이메일: 이메일 형식 유효성
 * - 비밀번호: 최소 8자 이상
 */
export const loginSchema = z.object({
  email:    z.string().email('이메일 형식을 확인해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이에요.').max(72, '비밀번호는 72자 이하예요.'),
})

/**
 * 회원가입 스키마
 * 
 * 검증 항목:
 * - 이메일: 이메일 형식 유효성
 * - 비밀번호: 최소 8자 이상
 * - 비밀번호 확인: 비밀번호와 일치 여부
 * - 닉네임: 2자 이상 20자 이하
 */
export const signupSchema = z.object({
  email:           z.string().email('이메일 형식을 확인해 주세요.'),
  password:        z.string().min(8, '비밀번호는 8자 이상이에요.').max(72, '비밀번호는 72자 이하예요.'),
  passwordConfirm: z.string(),
  nickname:        z.string().min(1, '닉네임을 입력해 주세요.').max(50, '닉네임은 50자 이하예요.'),
}).refine((d) => d.password === d.passwordConfirm, {
  message: '비밀번호가 일치하지 않아요.',
  path: ['passwordConfirm'],
})

// ── Request/Response 타입: API 통신 데이터 타입 ───────────────────────────────────────────────────

// 로그인 요청 타입: loginSchema에서 추론
export type LoginRequest   = z.infer<typeof loginSchema>

// 회원가입 폼 타입: 폼 입력용 (passwordConfirm 포함, 프론트 검증 전용)
export type SignupForm     = z.infer<typeof signupSchema>

// 회원가입 요청 타입: 서버 전송용 (passwordConfirm 제외)
export type SignupRequest  = Omit<SignupForm, 'passwordConfirm'>

// 로그인 응답 타입: 가이드 §5 기준 — data 가 사용자 정보 객체 자체
export type LoginResponse = User

// 소셜 로그인 provider: 가이드 — URL 경로용 소문자 (kakao / google)
export type OAuthProvider = 'kakao' | 'google'

/**
 * 소셜 로그인 요청 타입
 * 카카오/구글 둘 다 redirect 흐름으로 통일 — 콜백에서 받은 code 를 백엔드로 전달
 * (백엔드가 provider 의 /oauth/token 으로 토큰 교환 + 사용자 정보 조회)
 */
export interface OAuthLoginRequest {
  provider: OAuthProvider
  code: string
  redirectUri: string
}

// 프로필 수정 요청 타입 (PATCH /api/v1/users/me)
//   nickname:     null/생략 = 변경 X, 1~50자 = 변경
//   profileImage: null/생략 = 변경 X, "" = 제거, "<URL>" = 변경
export interface UpdateProfileRequest {
  nickname?: string | null
  profileImage?: string | null
}

// ── 라운드14: LOCAL ↔ OAuth 2-step 명시 연결 ────────────────────────────
//
//  (1) Preview — provider OAuth code 받은 직후, LOCAL 로그인 상태에서 호출
//      POST /api/v1/auth/social-link/{provider}/preview  body { code, redirectUri }
//      → 200 { linkKey, provider, providerEmail, expiresInSeconds }
//      → 409 AUTH_OAUTH_LINK_NOT_LOCAL — 이미 소셜 연결된 계정
//      → 400 AUTH_OAUTH_LINK_EMAIL_MISMATCH — 로그인 email ≠ provider email
//      → 401 AUTH_OAUTH_FAILED — OAuth 토큰 교환 실패
//
//  (2) Confirm — 사용자 확인 후
//      POST /api/v1/auth/social-link/confirm  body { linkKey }
//      → 200 MeResponse (갱신된 user)
//      → 400 AUTH_OAUTH_LINK_KEY_INVALID — 5분 TTL 만료 / 무효 / 다른 user
//
//  연결 후 LOCAL password 유지. socialProvider 가 provider 로 갱신되지만
//  hasPassword=true 가 함께 와서 양쪽 로그인 모두 가능함.
export interface SocialLinkPreviewRequest {
  provider: OAuthProvider
  code: string
  redirectUri: string
}

export interface SocialLinkPreviewResponse {
  linkKey: string
  provider: OAuthProvider | string   // 백엔드 표기 (KAKAO/GOOGLE) 가능성 대비
  providerEmail: string
  expiresInSeconds: number           // 보통 300 (5분)
}

export interface SocialLinkConfirmRequest {
  linkKey: string
}
