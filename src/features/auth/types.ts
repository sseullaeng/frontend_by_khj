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
