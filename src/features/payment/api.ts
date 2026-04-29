import api from '@/shared/api/axios'
import type {
  ChargeInitResponse,
  ChargeConfirmRequest,
  PointBalance,
  PointHistory,
  WithdrawRequest,
} from './types'
import type { PageResponse } from '@/shared/types'

export const paymentApi = {
  // 충전 초기화 → 토스 위젯 띄우기 위한 데이터
  initCharge: (amount: number) =>
    api.post<ChargeInitResponse>('/api/v1/payments/charge', { amount }),

  // 충전 확정 (토스 콜백 후)
  confirmCharge: (body: ChargeConfirmRequest) =>
    api.post<PointBalance>('/api/v1/payments/charge/confirm', body),

  // 포인트 잔액
  getBalance: () =>
    api.get<PointBalance>('/api/v1/point/balance'),

  // 포인트 내역
  getHistory: (params: { page?: number; size?: number }) =>
    api.get<PageResponse<PointHistory>>('/api/v1/point/history', { params }),

  // 출금 신청
  withdraw: (body: WithdrawRequest) =>
    api.post<void>('/api/v1/point/withdraw', body),
}
