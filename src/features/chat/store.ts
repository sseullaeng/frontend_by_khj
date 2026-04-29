import { create } from 'zustand'
import type { ChatMessage } from './types'

interface ChatState {
  /** roomId → 메시지 목록 */
  messagesByRoom: Record<number, ChatMessage[]>
  appendMessage: (roomId: number, msg: ChatMessage) => void
  setMessages: (roomId: number, msgs: ChatMessage[]) => void
  clearRoom: (roomId: number) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messagesByRoom: {},

  appendMessage: (roomId, msg) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: [...(s.messagesByRoom[roomId] ?? []), msg],
      },
    })),

  setMessages: (roomId, msgs) =>
    set((s) => ({
      messagesByRoom: { ...s.messagesByRoom, [roomId]: msgs },
    })),

  clearRoom: (roomId) =>
    set((s) => {
      const next = { ...s.messagesByRoom }
      delete next[roomId]
      return { messagesByRoom: next }
    }),
}))
