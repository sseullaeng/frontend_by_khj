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
  email:    z.string().email('이메일 형식을 확인해 주세요.'),  // 이메일 형식 검증
  password: z.string().min(8, '비밀번호는 8자 이상이에요.'),  // 비밀번호 길이 검증
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
  email:           z.string().email('이메일 형식을 확인해 주세요.'),  // 이메일 형식 검증
  password:        z.string().min(8, '비밀번호는 8자 이상이에요.'),  // 비밀번호 길이 검증
  passwordConfirm: z.string(),  // 비밀번호 확인
  nickname:        z.string().min(2, '닉네임은 2자 이상이에요.').max(20, '닉네임은 20자 이하예요.'),  // 닉네임 길이 검증
}).refine((d) => d.password === d.passwordConfirm, {
  message: '비밀번호가 일치하지 않아요.',  // 비밀번호 일치 검증
  path: ['passwordConfirm'],
})

// ── Request/Response 타입: API 통신 데이터 타입 ───────────────────────────────────────────────────

// 로그인 요청 타입: loginSchema에서 추론
export type LoginRequest   = z.infer<typeof loginSchema>

// 회원가입 요청 타입: signupSchema에서 추론
export type SignupRequest  = z.infer<typeof signupSchema>

// 로그인 응답 타입
export interface LoginResponse {
  user: User  // 로그인된 사용자 정보
}

// 프로필 수정 요청 타입
export interface UpdateProfileRequest {
  nickname: string
  profileImageKey?: string
}
