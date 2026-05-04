// 관리자 영역 타입 — 가이드 §11 + §10.8/10.9
//
// ⚠️ 일반 사용자 AT/RT 와 분리된 관리자 AT/RT 사용 — 같은 브라우저 동시 접속 불가.

import type { SocialProvider } from '@/shared/types/user'
import type { TransactionStatus } from '@/features/trade/types'
import type { DeliveryStatus } from '@/features/delivery/types'
import type { WithdrawalStatus } from '@/features/payment/types'

// ── 관리자 로그인 ─────────────────────────────────────────────────────────
export interface AdminLoginRequest {
  username: string
  password: string
}

// ── User 관리 (§11.2) ─────────────────────────────────────────────────────
// 라운드9 — 백엔드 응답 enriched
export type AdminUserStatusBE = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'WITHDRAWN'

export interface AdminUser {
  id: number
  email: string
  nickname: string
  profileImage: string | null
  socialProvider: SocialProvider
  blocked: boolean
  deleted: boolean
  trustScore: number | null
  reviewCount: number
  pointBalance: number
  createdAt: string
  // 라운드9 enriched
  status: AdminUserStatusBE
  tradeCount: number
  reportCount: number
  dormant: boolean
  suspendedAt: string | null
  suspendedUntil: string | null
  suspendDays: number | null
  lastLoginAt: string | null
}

// ── Banner (§10.8 + §11.3) ────────────────────────────────────────────────
export interface Banner {
  id: number
  adminId: number
  title: string
  imageUrl: string
  linkUrl: string | null
  sortOrder: number
  active: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

export interface BannerUpsertRequest {
  title: string
  imageUrl: string
  linkUrl?: string
  sortOrder: number
  startsAt?: string
  endsAt?: string
}

// ── Notice (§10.9 + §11.4) ────────────────────────────────────────────────
// 라운드9: 백엔드 NoticeType 에 '새소식' 추가됨
export type NoticeType = '공지' | '이벤트' | '새소식'

export interface Notice {
  id: number
  adminId: number
  type: NoticeType
  title: string
  content: string
  imageUrl: string | null
  pinned: boolean
  published: boolean
  viewCount: number
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

export interface NoticeUpsertRequest {
  type: NoticeType
  title: string
  content: string
  imageUrl?: string
  startsAt?: string
  endsAt?: string
}

// ── Report 처리 (§11.5) ───────────────────────────────────────────────────
export type AdminReportStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
export type AdminReportAction = 'MARK_IN_PROGRESS' | 'COMPLETE' | 'REJECT'

export interface AdminReport {
  id: number
  reporterId: number
  reportedId: number
  itemId: number | null
  reason: string
  detail: string | null
  status: AdminReportStatus
  adminId: number | null
  adminMemo: string | null
  processedAt: string | null
  createdAt: string
}

export interface AdminReportPatchRequest {
  action: AdminReportAction
  memo?: string
}

// ── Withdrawal 처리 (§11.6) ───────────────────────────────────────────────
export type AdminWithdrawalAction = 'APPROVE' | 'REJECT' | 'COMPLETE'

export interface AdminWithdrawalPatchRequest {
  action: AdminWithdrawalAction
  memo?: string
}

// ── Dashboard (§11.7) ─────────────────────────────────────────────────────
export interface AdminDashboard {
  users: { total: number; blocked: number; deleted: number; active: number }
  transactions: { total: number; byStatus: Record<TransactionStatus, number> }
  payments: { paidCount: number; totalPaidAmount: number }
  withdrawals: {
    total: number
    byStatus: Record<WithdrawalStatus, number>
    completedAmount: number
  }
  deliveries: {
    total: number
    byStatus: Record<DeliveryStatus, number>
    settledFeeTotal: number
  }
}
