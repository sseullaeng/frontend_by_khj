export interface ChatRoom {
  id: number
  itemId: number
  itemTitle: string
  itemImageUrl: string | null
  opponentId: number
  opponentNickname: string
  opponentProfileImageUrl: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  isSeller: boolean
}

export interface ChatMessage {
  id: number
  roomId: number
  senderId: number
  content: string
  imageUrl: string | null
  sentAt: string
}

export interface SendMessageRequest {
  roomId: number
  content: string
  imageKey?: string
}
