// 리뷰 도메인 — 가이드 §10.12
//
// ⚠️ comment 는 "작성자 본인 조회 시에만" 채워짐. 타인 조회 시 null 마스킹.
// 거래완료 7일 이내 + 거래 참여자만 작성 가능.

import type { TradeType } from '@/features/item/types'

// 작성/조회 schema
export interface Review {
  id: number
  transactionId: number
  reviewerId: number
  revieweeId: number
  rating: number              // 1~5
  comment: string | null      // 본인 조회시만 값, 타인은 null
  createdAt: string
}

// 리뷰 작성 요청
export interface ReviewCreateRequest {
  transactionId: number
  rating: number              // 1~5
  comment?: string            // ≤500
}

// 작성 대기 (내가 reviewer 로 아직 작성 안 한 7일 이내 완료 거래)
//
// 라운드13 PR #133 — 거래대행도 paired Transaction 자동 생성되어 포함됨.
//   거래대행(EXTERNAL) 인 경우 itemId 가 null (Item 미연결).
export interface PendingReview {
  transactionId: number
  itemId: number | null
  revieweeId: number          // 상대방
  tradeType: TradeType
  price: number
  completedAt: string
  deadline: string            // 완료 + 7일
}
