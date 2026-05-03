// 사용자 공개 프로필 API
import api from '@/shared/api/axios'
import type { SocialProvider } from '@/shared/types/user'

// GET /api/v1/users/{id}/profile 응답 (공개, 비로그인 OK)
export interface PublicUserProfile {
  id: number
  nickname: string
  profileImage: string | null
  trustScore: number | null  // null = 신규 (리뷰 0건)
  reviewCount: number
  socialProvider: SocialProvider
  createdAt: string
}

export const userApi = {
  getProfile: (userId: number) =>
    api.get<PublicUserProfile>(`/api/v1/users/${userId}/profile`),

  // 사용자 신고 (이메일 인증 필수) — 가이드 §10
  report: (userId: number, body: { reason: string; detail?: string }) =>
    api.post<{ id: number }>(`/api/v1/users/${userId}/report`, body),
}
