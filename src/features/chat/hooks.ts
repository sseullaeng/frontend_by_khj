/**
 * useChatRoom
 *
 * REST(React Query infinite) + WebSocket(STOMP) 합성 훅.
 * - 초기 메시지: REST GET (커서 페이징)
 * - 실시간 수신: STOMP subscribe '/topic/chat-room/{roomId}'
 * - 전송: STOMP send '/app/chat.send'
 *
 * ⚠️ WebSocket은 실서버 필수 (MSW mock 불가)
 */

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import type { PageResponse } from '@/shared/types'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { chatApi } from './api'
import { useChatStore } from './store'
import type { ChatMessage } from './types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws-stomp'

export function useChatRoom(roomId: number) {
  const { appendMessage, setMessages, messagesByRoom } = useChatStore()
  const stompRef = useRef<Client | null>(null)

  // ── 과거 메시지 (REST, infinite) ──────────────────────────────────────────
  const historyQuery = useInfiniteQuery({
    queryKey: ['chat', 'messages', roomId],
    queryFn: async ({ pageParam }: { pageParam: number | undefined }) => {
      const res = await chatApi.getMessages(roomId, { before: pageParam, size: 30 })
      return res.data
    },
    getNextPageParam: (last) => (last.hasPrevious ? last.content[0]?.id : undefined),
    initialPageParam: undefined as number | undefined,
  })

  useEffect(() => {
    if (historyQuery.data) {
      const all = (historyQuery.data as InfiniteData<PageResponse<ChatMessage>>)
        .pages.flatMap((p) => p.content).reverse()
      setMessages(roomId, all)
    }
  }, [historyQuery.data, roomId, setMessages])

  // ── STOMP 연결 ────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5_000,
      onConnect: () => {
        client.subscribe(`/topic/chat-room/${roomId}`, (frame: IMessage) => {
          const msg: ChatMessage = JSON.parse(frame.body)
          appendMessage(roomId, msg)
        })
      },
    })

    client.activate()
    stompRef.current = client

    return () => {
      client.deactivate()
      stompRef.current = null
    }
  }, [roomId, appendMessage])

  // ── 메시지 전송 ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string, imageKey?: string) => {
      stompRef.current?.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ roomId, content, imageKey }),
      })
    },
    [roomId]
  )

  return {
    messages: messagesByRoom[roomId] ?? [],
    historyQuery,
    sendMessage,
  }
}
