// 채팅 상태 스토어: 채팅방별 메시지 관리 (Zustand)
import { create } from 'zustand'  // Zustand 상태 관리 라이브러리
import type { ChatMessage } from './types'  // 채팅 메시지 타입

// 채팅 상태 인터페이스
interface ChatState {
  /** roomId → 메시지 목록: 채팅방별 메시지 저장 */
  messagesByRoom: Record<number, ChatMessage[]>
  appendMessage: (roomId: number, msg: ChatMessage) => void  // 메시지 추가
  setMessages: (roomId: number, msgs: ChatMessage[]) => void   // 메시지 목록 설정
  clearRoom: (roomId: number) => void                           // 채팅방 메시지 초기화
}

/**
 * 채팅 상태 스토어
 * 
 * 기능:
 * - 채팅방별 메시지 목록 관리
 * - 메시지 추가 및 설정
 * - 채팅방 메시지 초기화
 * - 실시간 메시지 업데이트 지원
 */
export const useChatStore = create<ChatState>((set) => ({
  messagesByRoom: {},  // 초기 상태: 빈 메시지 목록

  // 메시지 추가: 특정 채팅방에 메시지 추가
  appendMessage: (roomId, msg) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: [...(s.messagesByRoom[roomId] ?? []), msg],  // 기존 메시지에 새 메시지 추가
      },
    })),

  // 메시지 목록 설정: 특정 채팅방의 메시지 목록 전체 설정
  setMessages: (roomId, msgs) =>
    set((s) => ({
      messagesByRoom: { ...s.messagesByRoom, [roomId]: msgs },  // 메시지 목록 교체
    })),

  // 채팅방 메시지 초기화: 특정 채팅방의 메시지 목록 비우기
  clearRoom: (roomId) =>
    set((s) => {
      const next = { ...s.messagesByRoom }
      delete next[roomId]
      return { messagesByRoom: next }
    }),
}))
