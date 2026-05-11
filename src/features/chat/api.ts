// 채팅 API — 가이드 §10.4 / §10.5
//
// ⚠️ 메시지 전송은 REST 만 (STOMP /app/chat/send 미구현).
// ⚠️ 메시지 목록은 PageResponse 가 아니라 List<MessageResponse> + before 커서.
import api from '@/shared/api/axios'
import type { ChatRoom, ChatMessage, SendMessageRequest } from './types'
import type { PageResponse } from '@/shared/types'

export const chatApi = {
  // 채팅방 목록 (lastMessageAt DESC)
  getRooms: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<ChatRoom>>('/api/v1/chat-rooms', { params }),

  // 채팅방 단건 (참여자만)
  getRoom: (id: number) =>
    api.get<ChatRoom>(`/api/v1/chat-rooms/${id}`),

  // 채팅방 생성 (멱등) — 본인 물품 거부, 이메일 인증 필수
  createRoom: (itemId: number) =>
    api.post<ChatRoom>('/api/v1/chat-rooms', { itemId }),

  // 메시지 목록 — 커서 페이징 (before = MongoDB ObjectId hex string)
  // 응답: List<MessageResponse> (PageResponse 아님)
  getMessages: (roomId: number, params?: { before?: string; size?: number }) =>
    api.get<ChatMessage[]>(`/api/v1/chat-rooms/${roomId}/messages`, { params }),

  // 메시지 전송 (REST) — 백엔드가 자동 broadcast + 상대 알림 push
  sendMessage: (roomId: number, body: SendMessageRequest) =>
    api.post<ChatMessage>(`/api/v1/chat-rooms/${roomId}/messages`, body),

  // 읽음 처리 — 채팅방 진입 시 / 새 메시지 수신 후 호출
  markRead: (roomId: number) =>
    api.patch<ChatRoom>(`/api/v1/chat-rooms/${roomId}/read`),

  // 라운드12 — 채팅방 나가기 (본인만, body 없음)
  //   에러: 404 CHAT_ROOM_NOT_FOUND / 403 CHAT_FORBIDDEN
  leave: (roomId: number) =>
    api.patch<void>(`/api/v1/chat-rooms/${roomId}/leave`),
}
