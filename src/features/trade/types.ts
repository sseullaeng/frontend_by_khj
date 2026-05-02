// 거래(Transaction) 도메인 타입 — 백엔드 spec 정합 (PR #67 라운드)
//
// 상태 머신:
//   채팅중 → 예약 → 거래완료
//      └─→ 취소 (채팅중/예약 양쪽에서 가능)
import type { TradeType } from '@/features/item/types'

export type TransactionStatus = '채팅중' | '예약' | '거래완료' | '취소'
export type TransactionAction = '예약' | '거래완료' | '취소'

export interface Transaction {
  id: number
  itemId: number
  sellerId: number
  buyerId: number
  tradeType: TradeType         // 판매 | 대여 | 나눔
  price: number
  deposit: number | null       // 대여만
  rentalStart: string | null   // 대여만 (KST naive ISO)
  rentalEnd: string | null     // 대여만 (KST naive ISO)
  status: TransactionStatus
  reservedAt: string | null
  completedAt: string | null
  canceledAt: string | null
  cancelReason: string | null
  createdAt: string
  updatedAt: string
}

// 거래 생성 요청
export interface TransactionCreateRequest {
  itemId: number
  rentalStart?: string  // 대여만
  rentalEnd?: string    // 대여만
}

// 상태 전이 요청 (PATCH)
export interface TransactionPatchRequest {
  action: TransactionAction
  cancelReason?: string  // action=취소 일 때만
}

// 마이페이지 탭 필터
export type TransactionRole = 'buyer' | 'seller'

export interface TransactionListParams {
  role?: TransactionRole
  status?: TransactionStatus
  page?: number
  size?: number
}
