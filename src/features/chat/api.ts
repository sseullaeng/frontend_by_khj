import api from '@/shared/api/axios'
import type { ChatRoom, ChatMessage } from './types'
import type { PageResponse } from '@/shared/types'

export const chatApi = {
  getRooms: () =>
    api.get<ChatRoom[]>('/api/v1/chat-rooms'),

  getRoom: (id: number) =>
    api.get<ChatRoom>(`/api/v1/chat-rooms/${id}`),

  /** 커서 기반 메시지 페이징 (위로 스크롤 시 이전 메시지 로드) */
  getMessages: (roomId: number, params: { before?: number; size?: number }) =>
    api.get<PageResponse<ChatMessage>>(`/api/v1/chat-rooms/${roomId}/messages`, { params }),

  createRoom: (itemId: number) =>
    api.post<ChatRoom>('/api/v1/chat-rooms', { itemId }),
}
