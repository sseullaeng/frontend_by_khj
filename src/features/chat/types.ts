// 채팅 관련 타입: 채팅방 및 메시지 데이터 타입 정의

/**
 * 채팅방 정보 인터페이스
 * 
 * 채팅방의 기본 정보와 상대방 정보, 마지막 메시지 등을 포함
 */
export interface ChatRoom {
  id: number                    // 채팅방 고유 ID
  itemId: number               // 관련 물품 ID
  itemTitle: string             // 물품 제목
  itemImageUrl: string | null    // 물품 이미지
  opponentId: number            // 상대방 ID
  opponentNickname: string       // 상대방 닉네임
  opponentProfileImageUrl: string | null  // 상대방 프로필 이미지
  lastMessage: string | null     // 마지막 메시지
  lastMessageAt: string | null   // 마지막 메시지 시간
  unreadCount: number           // 읽지 않은 메시지 수
  isSeller: boolean             // 판매자 여부
}

/**
 * 채팅 메시지 인터페이스
 * 
 * 개별 메시지의 정보를 포함
 */
export interface ChatMessage {
  id: number          // 메시지 고유 ID
  roomId: number      // 채팅방 ID
  senderId: number    // 발신자 ID
  content: string     // 메시지 내용
  imageUrl: string | null  // 첨부 이미지
  sentAt: string     // 발신 시간
}

/**
 * 메시지 전송 요청 인터페이스
 * 
 * 메시지 전송 시 필요한 데이터
 */
export interface SendMessageRequest {
  roomId: number      // 채팅방 ID
  content: string     // 메시지 내용
  imageKey?: string  // 첨부 이미지 키 (선택적)
}
