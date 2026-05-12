// 채팅 도메인 타입 — 가이드 §10.4 / §10.5 정합
//
// ⚠️ Message:
//   - id 는 MongoDB ObjectId hex string (NOT number)
//   - 필드는 chatRoomId (NOT roomId)
//   - imageUrls 는 배열 (NOT single imageUrl)
//   - createdAt 은 Instant (UTC offset 포함, "...Z" 형식)
import type { TradeType } from '@/features/item/types'
import type { TransactionStatus } from '@/features/trade/types'
import type { EscrowApplicationStatus } from '@/features/escrow/types'

// 라운드13 PR-C #6 — 채팅 시스템 카드. 첫 메시지 send 시점에 백엔드가 lazy 생성.
//   GET /api/v1/chat-rooms/{id} 응답에만 포함, 첫 메시지 전엔 null.
//
// 라운드13 PR #131/#132 — cardKind 분기. 거래대행 우선:
//   - cardKind='Transaction' : 직거래 진행 중. transactionId/Status 채워짐.
//   - cardKind='EscrowApplication' : INTERNAL 거래대행 진행 중. escrowApplicationId/Status 채워짐.
//     (INTERNAL 거래대행 있으면 Transaction 카드는 나오지 않음)
//   - cardKind='Item' : 아직 거래 시작 전.
export type ChatRoomCardKind = 'Item' | 'Transaction' | 'EscrowApplication'

// tradeMode — '배달대행' 케이스 포함 (백엔드 spec)
export type ChatCardTradeMode = TradeType | '배달대행'

export interface ChatRoomCard {
  cardKind?:        ChatRoomCardKind
  tradeMode:        ChatCardTradeMode
  itemId:           number
  itemTitle:        string
  itemThumbnailUrl: string | null
  price:            number

  // cardKind='Transaction' 일 때 채워짐
  transactionId?:     number | null
  transactionStatus?: TransactionStatus | null

  // cardKind='EscrowApplication' 일 때 채워짐 (INTERNAL 거래대행만)
  escrowApplicationId?: number | null
  escrowStatus?:        EscrowApplicationStatus | null
  deliveryId?:          number | null
}

export interface ChatRoom {
  id: number
  itemId: number

  // viewer 기준 derived 필드 — 프론트는 이거만 보면 됨
  opponentId: number
  opponentNickname: string
  opponentProfileImage: string | null
  isSeller: boolean   // 라운드9 — 백엔드 응답에 포함 (본인이 판매자인지)
  myUnread: number
  itemTitle: string
  itemThumbnailUrl: string | null

  // 메타
  lastMessage: string | null
  lastMessageAt: string | null
  active: boolean

  // raw — 호환용 (v2 에서 제거 예정. 신규 코드는 derived 사용)
  user1Id: number
  user2Id: number
  user1Unread: number
  user2Unread: number

  // 라운드12 — 채팅방 나가기 상태
  iLeft: boolean        // 본인이 leave 했는지 (백엔드 listMine 에서 자동 필터되긴 함)
  opponentLeft: boolean // 상대방이 leave 했는지 — UI 가 입력창/액션 disable + 시스템 메시지

  // 라운드13 (PR #111) — 채팅방의 거래 모드. 같은 (item, buyer, seller) 라도 mode 다르면 별도 채팅방.
  //   생성 시 null 보내면 백엔드가 item.tradeType 자동 사용 → 응답엔 항상 채워져 옴.
  tradeMode: TradeType

  // 라운드13 PR-C #6 — 채팅 시스템 카드. detail 응답에만 포함, 첫 메시지 전엔 null.
  card?: ChatRoomCard | null

  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string                 // ⚠️ MongoDB ObjectId hex
  chatRoomId: number         // ⚠️ roomId 아님
  senderId: number
  content: string | null     // null 가능 (이미지만 보낼 때)
  imageUrls: string[]        // ⚠️ 배열, 빈 배열 가능
  createdAt: string          // Instant — UTC offset 포함 ("...Z")
}

// 메시지 전송 body — content 또는 imageUrls 둘 중 하나 이상 필수
export interface SendMessageRequest {
  content?: string
  imageUrls?: string[]
}
