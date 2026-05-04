// 백엔드 AdminUser ↔ AdminUserListPanel(LocalAdminUser) 어댑터.
//
// 라운드9: 백엔드 응답에 status/tradeCount/reportCount/dormant/suspendedAt/
// suspendedUntil/suspendDays/lastLoginAt 모두 포함됨. 어댑터에서 0/임시값 제거.

import type { AdminUser as BackendAdminUser } from '@/features/admin/types'
import type { AdminUser as PanelAdminUser, AdminUserStatus } from '@/pages/admin/components/AdminUserListPanel'

const SOCIAL_LABEL: Record<BackendAdminUser['socialProvider'], string> = {
  LOCAL: '이메일',
  KAKAO: '카카오',
  GOOGLE: '구글',
}

export function toPanelUser(u: BackendAdminUser): PanelAdminUser {
  return {
    id: u.id,
    nickname: u.nickname,
    email: u.email,
    memberId: `user_${String(u.id).padStart(3, '0')}`,
    signupPath: SOCIAL_LABEL[u.socialProvider] ?? '이메일',
    joinedAt: u.createdAt.slice(0, 10),
    status: u.status as AdminUserStatus,
    trustScore: u.trustScore ?? 0,
    tradeCount: u.tradeCount,
    reportCount: u.reportCount,
    suspendedAt: u.suspendedAt ?? undefined,
    suspendDays: u.suspendDays ?? undefined,
  }
}
