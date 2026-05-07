// 거래(Transaction) 도메인 타입 — 라운드 11 (Tx-Hold) 정합
//
// 상태 머신:
//   채팅중 → 예약 (buyer hold) → 인계완료 (seller 인계확인) → 거래완료 (buyer 인수확인 + 정산)
//                              └─ 단계별 취소 (인계완료 이후 차단)
import type { TradeType } from '@/features/item/types'

export type TransactionStatus = '채팅중' | '예약' | '인계완료' | '거래완료' | '취소'
export type TransactionAction = '예약' | '인계확인' | '인수확인' | '취소'

export interface Transaction {
  id: number
  itemId: number
  sellerId: number
  buyerId: number
  tradeType: TradeType
  price: number
  deposit: number | null
  rentalStart: string | null
  rentalEnd: string | null
  status: TransactionStatus
  reservedAt: string | null
  handoverConfirmedAt: string | null   // 라운드11: seller 인계확인 시각
  receiveConfirmedAt:  string | null   // 라운드11: buyer 인수확인 시각
  completedAt: string | null
  canceledAt: string | null
  cancelReason: string | null
  escrowHoldAmount: number             // 라운드11: 예약 시 hold 금액 (환불 추적용)
  createdAt: string
  updatedAt: string
}

export interface TransactionCreateRequest {
  itemId: number
  rentalStart?: string
  rentalEnd?: string
}

export interface TransactionPatchRequest {
  action: TransactionAction
  cancelReason?: string
}

export type TransactionRole = 'buyer' | 'seller'

export interface TransactionListParams {
  role?: TransactionRole
  status?: TransactionStatus
  page?: number
  size?: number
}
