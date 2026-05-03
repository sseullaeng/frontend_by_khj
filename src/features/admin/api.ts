// 관리자 API — 가이드 §11
import api from '@/shared/api/axios'
import type {
  AdminDashboard,
  AdminLoginRequest,
  AdminReport,
  AdminReportPatchRequest,
  AdminReportStatus,
  AdminUser,
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
export interface AdminTransactionSearchParams {
  startDate?: string   // ISO LocalDateTime
  endDate?: string
  type?: '판매' | '대여' | '나눔'
  status?: '채팅중' | '예약' | '거래완료' | '취소'
  keyword?: string     // ⚠️ 숫자만 (transactionId 또는 itemId 정확 매칭)
  page?: number
  size?: number
}

export const adminApi = {
  // 11.1 로그인 — 별도 admin AT/RT 발급
  login: (body: AdminLoginRequest) =>
    api.post<void>('/api/v1/auth/admin/login', body),

  // 11.2 회원
  users: {
    list: (params?: { page?: number; size?: number }) =>
      api.get<PageResponse<AdminUser>>('/api/v1/admin/users', { params }),
    detail: (id: number) =>
      api.get<AdminUser>(`/api/v1/admin/users/${id}`),
    setBlocked: (id: number, blocked: boolean) =>
      api.patch<void>(`/api/v1/admin/users/${id}/block`, { blocked }),
  },

  // 11.3 배너
  banners: {
    list: (params?: { page?: number; size?: number }) =>
      api.get<PageResponse<Banner>>('/api/v1/admin/banners', { params }),
    detail: (id: number) =>
      api.get<Banner>(`/api/v1/admin/banners/${id}`),
    create: (body: BannerUpsertRequest) =>
      api.post<{ id: number }>('/api/v1/admin/banners', body),
    update: (id: number, body: BannerUpsertRequest) =>
      api.patch<void>(`/api/v1/admin/banners/${id}`, body),
    setActive: (id: number, active: boolean) =>
      api.patch<void>(`/api/v1/admin/banners/${id}/active`, { active }),
    delete: (id: number) =>
      api.delete<void>(`/api/v1/admin/banners/${id}`),
  },

  // 11.4 공지
  notices: {
    list: (params?: { type?: NoticeType; page?: number; size?: number }) =>
      api.get<PageResponse<Notice>>('/api/v1/admin/notices', { params }),
    detail: (id: number) =>
      api.get<Notice>(`/api/v1/admin/notices/${id}`),
    create: (body: NoticeUpsertRequest) =>
      api.post<{ id: number }>('/api/v1/admin/notices', body),
    update: (id: number, body: NoticeUpsertRequest) =>
      api.patch<void>(`/api/v1/admin/notices/${id}`, body),
    setPinned: (id: number, value: boolean) =>
      api.patch<void>(`/api/v1/admin/notices/${id}/pin`, { value }),
    setPublished: (id: number, value: boolean) =>
      api.patch<void>(`/api/v1/admin/notices/${id}/publish`, { value }),
    delete: (id: number) =>
      api.delete<void>(`/api/v1/admin/notices/${id}`),
  },

  // 11.5 신고
  reports: {
    list: (params?: { status?: AdminReportStatus; page?: number; size?: number }) =>
      api.get<PageResponse<AdminReport>>('/api/v1/admin/reports', { params }),
    detail: (id: number) =>
      api.get<AdminReport>(`/api/v1/admin/reports/${id}`),
    patch: (id: number, body: AdminReportPatchRequest) =>
      api.patch<void>(`/api/v1/admin/reports/${id}`, body),
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
  },

  // 라운드8 — 거래 검색
  transactions: {
    list: (params?: AdminTransactionSearchParams) =>
      api.get<PageResponse<Transaction>>('/api/v1/admin/transactions', { params }),
  },
}
