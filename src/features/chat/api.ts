// 채팅 API: 채팅방 및 메시지 관리 API 호출
import api from '@/shared/api/axios'  // 기본 API 클라이언트
import type { ChatRoom, ChatMessage } from './types'  // 채팅 관련 타입
import type { PageResponse } from '@/shared/types'  // 페이지 응답 타입

/**
 * 채팅 API 객체
 * 
 * 기능:
 * - 채팅방 목록 조회
 * - 채팅방 상세 정보 조회
 * - 메시지 목록 조회 (커서 기반 페이징)
 * - 채팅방 생성
 */
export const chatApi = {
  getRooms: () =>
    api.get<ChatRoom[]>('/api/v1/chat-rooms'),  // 채팅방 목록 조회

  getRoom: (id: number) =>
    api.get<ChatRoom>(`/api/v1/chat-rooms/${id}`),  // 채팅방 상세 정보 조회

  /** 커서 기반 메시지 페이징 (위로 스크롤 시 이전 메시지 로드) */
  getMessages: (roomId: number, params: { before?: number; size?: number }) =>
    api.get<PageResponse<ChatMessage>>(`/api/v1/chat-rooms/${roomId}/messages`, { params }),  // 메시지 목록 조회

  createRoom: (itemId: number) =>
    api.post<ChatRoom>('/api/v1/chat-rooms', { itemId }),  // 채팅방 생성
}
