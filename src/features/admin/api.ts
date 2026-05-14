// 관리자 API — 가이드 §11
import api from '@/shared/api/axios'
import type {
  AdminDashboard,
  AdminDashboardCharts,
  AdminDashboardChartsParams,
  AdminDeliveryItem,
  AdminDeliveryListParams,
  AdminDeliveryStats,
  AdminItemDetailResponse,
  AdminItemSummary,
  AdminItemsListParams,
  AdminLoginRequest,
  AdminMe,
  AdminReport,
  AdminReportPatchRequest,
  AdminReportStatus,
  AdminUser,
  AdminUserWithdrawRequest,
  AdminWithdrawalPatchRequest,
  Banner,
  BannerUpsertRequest,
  Notice,
  NoticeType,
  NoticeUpsertRequest,
} from './types'
import type { Withdrawal, WithdrawalStatus } from '@/features/payment/types'
import type { Transaction } from '@/features/transaction/types'
import type { PageResponse } from '@/shared/types'

// 라운드8 — 관리자 거래 검색 파라미터
// status / type 은 백엔드 한글 enum: '판매'/'대여'/'나눔', '채팅중'/'예약'/'거래완료'/'취소'
// 라운드9 — keyword 가 비숫자면 닉네임/이메일 LIKE (PR #83)
export interface AdminTransactionSearchParams {
  status?:
    | 'CHATTING'
    | 'RESERVED'
    | 'COMPLETED'
    | 'CANCELLED'
    | '채팅중'
    | '예약'
    | '거래완료'
    | '취소'
  buyerId?: number
  sellerId?: number
  page?: number
  size?: number
  // Legacy filters kept because existing admin dashboard links still provide them.
  startDate?: string // ISO LocalDateTime
  endDate?: string
  type?: '판매' | '대여' | '나눔'
  keyword?: string // 숫자: transactionId/itemId 정확 매칭, 그 외: 닉네임/이메일 LIKE (top 200 user)
}

// 라운드9 — 관리자 회원 검색 파라미터
import type { AdminUserStatusBE } from './types'
export interface AdminUserSearchParams {
  keyword?: string
  status?: AdminUserStatusBE
  createdAfter?: string // YYYY-MM-DD 또는 ISO LocalDateTime
  createdBefore?: string
  page?: number
  size?: number
}

export const adminApi = {
  // 11.1 로그인 — 별도 admin AT/RT 발급
  login: (body: AdminLoginRequest) => api.post<void>('/api/v1/auth/admin/login', body),

  // 관리자 본인 정보 — admin AT 전용 (일반 /users/me 는 ROLE_USER 만)
  me: () => api.get<AdminMe>('/api/v1/admin/me'),

  // 11.2 회원 (라운드9 + 라운드14 spec)
  users: {
    list: (params?: AdminUserSearchParams) =>
      api.get<PageResponse<AdminUser>>('/api/v1/admin/users', { params }),
    detail: (id: number) => api.get<AdminUser>(`/api/v1/admin/users/${id}`),
    // 영구 차단 토글 (BLOCKED ↔ ACTIVE)
    setBlocked: (id: number, blocked: boolean) =>
      api.patch<void>(`/api/v1/admin/users/${id}/block`, { blocked }),
    // 라운드14 — 시한부 활동 정지 (suspendedUntil 까지 SUSPENDED, 만료 후 자동 ACTIVE)
    //   body: { days: 1~365 }. cumulativeSuspendDays 누적 200 도달 시 자동 탈퇴 (스케줄러).
    suspend: (id: number, days: number) =>
      api.patch<void>(`/api/v1/admin/users/${id}/suspend`, { days }),
    // 라운드14 — 만료 전 수동 해제. 누적 일수는 차감되지 않음.
    unsuspend: (id: number) => api.delete<void>(`/api/v1/admin/users/${id}/suspend`),
    // 라운드14 — 관리자 강제 탈퇴 (복구 불가)
    withdraw: (id: number, body?: AdminUserWithdrawRequest) =>
      api.patch<void>(`/api/v1/admin/users/${id}/withdraw`, body),
  },

  // 11.3 배너
  banners: {
    list: (params?: { page?: number; size?: number }) =>
      api.get<PageResponse<Banner>>('/api/v1/admin/banners', { params }),
    detail: (id: number) => api.get<Banner>(`/api/v1/admin/banners/${id}`),
    create: (body: BannerUpsertRequest) => api.post<{ id: number }>('/api/v1/admin/banners', body),
    update: (id: number, body: BannerUpsertRequest) =>
      api.patch<void>(`/api/v1/admin/banners/${id}`, body),
    setActive: (id: number, active: boolean) =>
      api.patch<void>(`/api/v1/admin/banners/${id}/active`, { active }),
    delete: (id: number) => api.delete<void>(`/api/v1/admin/banners/${id}`),
  },

  // 11.4 공지
  notices: {
    list: (params?: { type?: NoticeType; page?: number; size?: number }) =>
      api.get<PageResponse<Notice>>('/api/v1/admin/notices', { params }),
    detail: (id: number) => api.get<Notice>(`/api/v1/admin/notices/${id}`),
    create: (body: NoticeUpsertRequest) => api.post<{ id: number }>('/api/v1/admin/notices', body),
    update: (id: number, body: NoticeUpsertRequest) =>
      api.patch<void>(`/api/v1/admin/notices/${id}`, body),
    setPinned: (id: number, value: boolean) =>
      api.patch<void>(`/api/v1/admin/notices/${id}/pin`, { value }),
    setPublished: (id: number, value: boolean) =>
      api.patch<void>(`/api/v1/admin/notices/${id}/publish`, { value }),
    delete: (id: number) => api.delete<void>(`/api/v1/admin/notices/${id}`),
  },

  // 11.5 신고
  reports: {
    list: (params?: { status?: AdminReportStatus; page?: number; size?: number }) =>
      api.get<PageResponse<AdminReport>>('/api/v1/admin/reports', { params }),
    detail: (id: number) => api.get<AdminReport>(`/api/v1/admin/reports/${id}`),
    patch: (id: number, body: AdminReportPatchRequest) =>
      api.patch<void>(`/api/v1/admin/reports/${id}`, body),
  },

  // 라운드13 PR #134 — 물품 관리
  items: {
    list: (params?: AdminItemsListParams) =>
      api.get<PageResponse<AdminItemSummary>>('/api/v1/admin/items', { params }),
    detail: (id: number) => api.get<AdminItemDetailResponse>(`/api/v1/admin/items/${id}`),
    // delete 는 기존 itemApi.deleteByAdmin (PR #54) 사용
  },

  // 라운드13 PR #134 — 배달 관리
  deliveries: {
    list: (params?: AdminDeliveryListParams) =>
      api.get<PageResponse<AdminDeliveryItem>>('/api/v1/admin/deliveries', { params }),
    stats: () => api.get<AdminDeliveryStats>('/api/v1/admin/deliveries/stats'),
  },

  // 11.6 출금
  withdrawals: {
    list: (params?: { status?: WithdrawalStatus; page?: number; size?: number }) =>
      api.get<PageResponse<Withdrawal>>('/api/v1/admin/withdrawals', { params }),
    patch: (id: number, body: AdminWithdrawalPatchRequest) =>
      api.patch<void>(`/api/v1/admin/withdrawals/${id}`, body),
  },

  // 11.7 대시보드 통계
  stats: {
    dashboard: () => api.get<AdminDashboard>('/api/v1/admin/stats/dashboard'),
    // 라운드12 — 차트 전용 (요약 카드 + 가입 추이 + 거래 종류/상태 분포)
    dashboardCharts: (params?: AdminDashboardChartsParams) =>
      api.get<AdminDashboardCharts>('/api/v1/admin/stats/dashboard/charts', { params }),
  },

  // 라운드8 — 거래 검색
  transactions: {
    list: (params?: AdminTransactionSearchParams) =>
      api.get<PageResponse<Transaction>>('/api/v1/admin/transactions', { params }),
  },

  // 라운드9 — 전체 알림 발송
  notifications: {
    broadcast: (body: { title: string; content: string; targetRole?: string }) =>
      api.post<{ sent: number }>('/api/v1/admin/notifications/broadcast', body),
  },
}
