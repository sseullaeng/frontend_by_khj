export type TransactionStatus =
  | 'CHATTING'
  | 'RESERVED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Transaction {
  id: number
  itemId: number
  itemTitle: string
  itemImageUrl: string | null
  buyerId: number
  buyerNickname: string
  sellerId: number
  sellerNickname: string
  price: number
  status: TransactionStatus
  // 라운드9: 백엔드 응답 필드명 'tradeType' (이전엔 'itemType' 으로 잘못 가정)
  tradeType?: '판매' | '대여' | '나눔'
  createdAt: string
  completedAt: string | null
}

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  CHATTING:  '채팅 중',
  RESERVED:  '예약',
  COMPLETED: '거래 완료',
  CANCELLED: '취소',
}

export const TRANSACTION_STEPS: TransactionStatus[] = [
  'CHATTING',
  'RESERVED',
  'COMPLETED',
]
