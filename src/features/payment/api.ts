// 결제·포인트·출금 API — 백엔드 spec 정합
import api from '@/shared/api/axios'
import type {
  PaymentStartResponse,
  PaymentConfirmRequest,
  PaymentResponse,
  PointHistory,
  PointHistoryType,
  WithdrawRequest,
  Withdrawal,
} from './types'
import type { PageResponse } from '@/shared/types'

export const paymentApi = {
  // 결제 시작 — 백엔드 merchantUid 발급
  startPayment: (amount: number) =>
    api.post<PaymentStartResponse>('/api/v1/payments/charge', { amount }),

  // 결제 확정 — 토스 successUrl 콜백 받은 후 검증·잔액 반영
  confirmPayment: (body: PaymentConfirmRequest) =>
    api.post<PaymentResponse>('/api/v1/payments/charge/confirm', body),

  // 포인트 내역
  getHistory: (params: { type?: PointHistoryType; page?: number; size?: number }) =>
    api.get<PageResponse<PointHistory>>('/api/v1/users/me/point/history', { params }),
}

export const withdrawalApi = {
  // 출금 신청 (멱등)
  create: (body: WithdrawRequest) =>
    api.post<number>('/api/v1/withdrawals', body),

  // 본인 출금 신청 목록
  getList: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Withdrawal>>('/api/v1/withdrawals', { params }),

  // 본인 출금 신청 단건
  getById: (id: number) =>
    api.get<Withdrawal>(`/api/v1/withdrawals/${id}`),

  // 출금 신청 취소 (신청 상태일 때만, 자동 환불)
  cancel: (id: number) =>
    api.delete<void>(`/api/v1/withdrawals/${id}`),
}
