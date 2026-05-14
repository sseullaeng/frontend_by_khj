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

// 관리자 본인 정보 — GET /api/v1/admin/me (admin AT 전용)
//   백엔드 정책: /users/me 는 ROLE_USER 만, admin 은 별도 endpoint 사용
export interface AdminMe {
  id: number
  username: string
  name: string
  role: 'ADMIN'
}

// ── User 관리 (§11.2) ─────────────────────────────────────────────────────
// 라운드9 — 백엔드 응답 enriched
// 라운드14 — BLOCKED (영구 차단) 추가. suspend/block/withdraw 3-way 분리.
export type AdminUserStatusBE =
  | 'ACTIVE'
  | 'DORMANT'
  | 'SUSPENDED' // 시한부 활동 정지, suspendedUntil 만료 후 자동 ACTIVE
  | 'BLOCKED' // 영구 차단, 관리자 수동 unblock 필요
  | 'WITHDRAWN' // 탈퇴, 복구 불가

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

  // 라운드14 — 연체 채무 (PR②에서 회원 목록 행 강조용)
  //   overdueDebt = 진행 중 record 의 extraDebtAmount 합계 (>0 이면 채무 있음).
  //   activeOverdueRecordId = 진행 중 record 중 가장 최근 1건의 id (없으면 null).
  overdueDebt?: number
  activeOverdueRecordId?: number | null
}

// ── Banner (§10.8 + §11.3) ────────────────────────────────────────────────
//   라운드13 — 일반/관리자 응답에서 adminId 제거 (운영자 식별 정보 노출 차단).
export interface Banner {
  id: number
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
export type AdminReportStatusKo = '접수' | '처리중' | '처리완료' | '반려'
export type AdminReportAction = 'MARK_IN_PROGRESS' | 'COMPLETE' | 'REJECT'

export interface AdminReport {
  id: number
  reporterId: number
  reportedId: number
  itemId: number | null
  reason: string
  detail: string | null
  status: AdminReportStatus | AdminReportStatusKo
  adminId: number | null
  adminMemo: string | null
  processedAt: string | null
  createdAt: string
}

export interface AdminReportPatchRequest {
  action: AdminReportAction
  memo?: string
}

export interface AdminUserWithdrawRequest {
  reason?: string
}

// ── Admin 물품 관리 (라운드13 PR #134) ───────────────────────────────────
import type {
  ItemDetail,
  ItemImage,
  TradeType,
  ItemStatus,
  RentalUnit,
  DepositType,
} from '@/features/item/types'

export interface AdminItemSummary {
  id: number
  sellerId: number
  sellerNickname: string
  title: string
  thumbnailUrl: string | null
  tradeTypes: TradeType[]
  salePrice: number | null
  rentalPrice: number | null
  // legacy
  tradeType: TradeType
  price: number
  categoryId: number | null
  status: ItemStatus
  region: string | null
  viewCount: number
  wishlistCount: number
  reportCount: number // ⭐ 누적 신고 수
  rentalActive?: boolean // 현재 실제 대여중 여부. tradeTypes 의 대여 지원 여부와 분리.
  createdAt: string
}

export interface AdminItemReportEntry {
  id: number
  reporterId: number
  reason: string
  status: string // 백엔드 status (예: '접수', PENDING 등)
  createdAt: string
}

export interface AdminItemTransactionEntry {
  id: number
  buyerId: number
  buyerNickname: string
  status: TransactionStatus
  price: number
  completedAt: string | null
}

export interface AdminItemDetailResponse {
  item: ItemDetail // 기존 ItemDetail (전체 필드)
  sellerNickname: string
  reportCount: number
  reportHistory: AdminItemReportEntry[]
  transactionHistory: AdminItemTransactionEntry[]
}

export interface AdminItemsListParams {
  q?: string
  status?: ItemStatus
  tradeType?: TradeType
  categoryId?: number
  createdAfter?: string
  createdBefore?: string
  sort?: 'latest' | 'view_desc' | 'report_desc'
  page?: number
  size?: number
}

// 명시적으로 사용하지 않는 import 방지용 re-export (lint)
export type { ItemImage, RentalUnit, DepositType }

// ── Admin 배달 관리 (라운드13 PR #134) ───────────────────────────────────

export interface AdminDeliveryItem {
  id: number
  requesterId: number
  requesterNickname: string
  riderId: number | null
  riderNickname: string | null
  pickupAddress: string
  dropoffAddress: string
  itemDescription: string
  fee: number
  status: DeliveryStatus
  requestedAt: string
  acceptedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  completedAt: string | null
  canceledAt: string | null
  cancelReason: string | null
  escrowApplicationId: number | null
}

export interface AdminDeliveryListParams {
  status?: DeliveryStatus
  riderId?: number
  requesterId?: number
  createdAfter?: string
  createdBefore?: string
  sort?: 'latest' | 'picked_up_desc'
  page?: number
  size?: number
}

export interface AdminDeliveryStats {
  byStatus: Record<DeliveryStatus, number>
  total: number
  todayNew: number
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

// ── Dashboard Charts (라운드 12) ──────────────────────────────────────────
//   GET /api/v1/admin/stats/dashboard/charts?startDate=&endDate=
//   기간 미지정 시 최근 14일 (today-13 ~ today, inclusive). 빈 일자는 0 채움.
//
//   매핑:
//     TradeType   = '판매' | '대여' | '나눔'   (ESCROW 미포함)
//     TradeStatus = '진행중' | '완료' | '취소'  (백엔드에서 5단계 → 3분류 그룹핑)
export type AdminChartTradeType = '판매' | '대여' | '나눔'
export type AdminChartTradeStatus = '진행중' | '완료' | '취소'

export interface AdminDashboardCharts {
  summary: {
    users: { total: number; monthDelta: number }
    todaySignups: { count: number; yesterdayDelta: number }
    monthTrades: { count: number; prevMonthRate: number | null } // 전월 0이면 null
    pendingReports: number
  }
  signupTrend: { date: string; count: number }[] // YYYY-MM-DD
  tradeByType: { type: AdminChartTradeType; count: number }[]
  tradeByStatus: { status: AdminChartTradeStatus; count: number }[]
  // 라운드12 PR #106 — 신고 위젯
  reportsSummary?: {
    pending: number // 접수 + 처리중
    resolved: number // 처리완료 + 반려
    totalLast7Days: number // 최근 7일 신고 수 (전체 status)
  }
}

export interface AdminDashboardChartsParams {
  startDate?: string // YYYY-MM-DD, 미지정 시 백엔드 default = today-13
  endDate?: string // YYYY-MM-DD, 미지정 시 백엔드 default = today
}
