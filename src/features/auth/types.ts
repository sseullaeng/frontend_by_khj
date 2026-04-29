import { z } from 'zod'
import type { User } from '@/shared/types'

// ── Zod 스키마 ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    z.string().email('이메일 형식을 확인해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이에요.'),
})

export const signupSchema = z.object({
  email:           z.string().email('이메일 형식을 확인해 주세요.'),
  password:        z.string().min(8, '비밀번호는 8자 이상이에요.'),
  passwordConfirm: z.string(),
  nickname:        z.string().min(2, '닉네임은 2자 이상이에요.').max(20, '닉네임은 20자 이하예요.'),
}).refine((d) => d.password === d.passwordConfirm, {
  message: '비밀번호가 일치하지 않아요.',
  path: ['passwordConfirm'],
})

// ── Request/Response 타입 ───────────────────────────────────────────────────

export type LoginRequest   = z.infer<typeof loginSchema>
export type SignupRequest  = z.infer<typeof signupSchema>

export interface LoginResponse {
  user: User
}
