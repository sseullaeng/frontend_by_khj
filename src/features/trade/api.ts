// 거래(Transaction) API — 백엔드 spec 정합
import api from '@/shared/api/axios'
import type {
  Transaction,
  TransactionCreateRequest,
  TransactionListParams,
  TransactionPatchRequest,
} from './types'
import type { PageResponse } from '@/shared/types'

export const transactionApi = {
  // 거래 생성 — 이메일 인증 필수, 본인 물품/비활성 물품 불가
  create: (body: TransactionCreateRequest) =>
    api.post<{ id: number }>('/api/v1/transactions', body),

  // 거래 단건 조회 — 참여자(seller/buyer)만
  getDetail: (id: number) =>
    api.get<Transaction>(`/api/v1/transactions/${id}`),

  // 내 거래 목록 — role/status 필터 (라운드14 4-B: status CSV 다중 지원)
  getMyList: (params?: TransactionListParams) => {
    const { status, ...rest } = params ?? {}
    const statusParam = Array.isArray(status) ? status.join(',') : status
    return api.get<PageResponse<Transaction>>('/api/v1/users/me/transactions', {
      params: { ...rest, ...(statusParam ? { status: statusParam } : {}) },
    })
  },

  // 상태 전이 — 라운드 11 (Tx-Hold)
  //   예약:     seller 만, 채팅중   → 예약       (buyer 포인트 hold)
  //   인계확인: seller 만, 예약    → 인계완료
  //   인수확인: buyer 만,  인계완료 → 거래완료   (정산: hold → seller)
  //   취소:     양쪽,    채팅중/예약 → 취소     (인계완료 이후 차단)
  patch: (id: number, body: TransactionPatchRequest) =>
    api.patch<void>(`/api/v1/transactions/${id}`, body),
}
