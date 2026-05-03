// 백엔드 AdminUser ↔ AdminUserListPanel(LocalAdminUser) 매핑 어댑터.
//
// AdminUserListPanel 은 main 측 mock 모델(memberId / signupPath / joinedAt / status / tradeCount / reportCount …)
// 을 그대로 받음. 여기서 백엔드 AdminUser 를 panel 이 기대하는 형태로 변환.
//
// 백엔드 미제공 필드 (tradeCount / reportCount / suspendedAt …) 는 0 또는 undefined 로 채움.
// 추후 백엔드가 해당 필드 합의 시 매핑 보강.

import type { AdminUser as BackendAdminUser } from '@/features/admin/types'
import type { AdminUser as PanelAdminUser, AdminUserStatus } from '@/pages/admin/components/AdminUserListPanel'

const SOCIAL_LABEL: Record<BackendAdminUser['socialProvider'], string> = {
  LOCAL: '이메일',
  KAKAO: '카카오',
  GOOGLE: '구글',
}

const computeStatus = (u: BackendAdminUser): AdminUserStatus => {
  if (u.deleted) return 'WITHDRAWN'
  if (u.blocked) return 'SUSPENDED'
  return 'ACTIVE'
}

export function toPanelUser(u: BackendAdminUser): PanelAdminUser {
  const joinedAt = u.createdAt.slice(0, 10)  // YYYY-MM-DD 부분만
  return {
    id: u.id,
    nickname: u.nickname,
    email: u.email,
    memberId: `user_${String(u.id).padStart(3, '0')}`,
    signupPath: SOCIAL_LABEL[u.socialProvider] ?? '이메일',
    joinedAt,
    status: computeStatus(u),
    trustScore: u.trustScore ?? 0,
    tradeCount: 0,    // TODO: 백엔드 미제공 — 합의 후 채움
    reportCount: 0,   // TODO: 백엔드 미제공
  }
}
