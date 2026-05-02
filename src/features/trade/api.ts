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

  // 내 거래 목록 — role/status 필터
  getMyList: (params?: TransactionListParams) =>
    api.get<PageResponse<Transaction>>('/api/v1/users/me/transactions', { params }),

  // 상태 전이 (예약/거래완료/취소)
  //   예약: seller 만, 채팅중 → 예약
  //   거래완료: seller 만, 예약 → 거래완료 (정산)
  //   취소: 양쪽, 채팅중/예약 → 취소
  patch: (id: number, body: TransactionPatchRequest) =>
    api.patch<void>(`/api/v1/transactions/${id}`, body),
}
