// 채팅 도메인 타입 — 가이드 §10.4 / §10.5 정합
//
// ⚠️ Message:
//   - id 는 MongoDB ObjectId hex string (NOT number)
//   - 필드는 chatRoomId (NOT roomId)
//   - imageUrls 는 배열 (NOT single imageUrl)
//   - createdAt 은 Instant (UTC offset 포함, "...Z" 형식)
import type { TradeType } from '@/features/item/types'

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
