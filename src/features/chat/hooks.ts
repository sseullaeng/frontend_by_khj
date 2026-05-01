// 채팅방 관련 훅: REST API + WebSocket(STOMP) 합성 채팅 기능
/**
 * useChatRoom 훅
 * 
 * 기능:
 * - REST(React Query infinite) + WebSocket(STOMP) 합성 훅
 * - 초기 메시지: REST GET (커서 페이징)
 * - 실시간 수신: STOMP subscribe '/topic/chat-room/{roomId}'
 * - 메시지 전송: STOMP send '/app/chat.send'
 * 
 * ⚠️ WebSocket은 실서버 필수 (MSW mock 불가)
 */
import { useEffect, useRef, useCallback } from 'react'  // React 훅들
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'  // React Query 훅
import type { PageResponse } from '@/shared/types'  // 페이지 응답 타입
import { Client, type IMessage } from '@stomp/stompjs'  // STOMP WebSocket 클라이언트
import SockJS from 'sockjs-client'  // WebSocket 클라이언트
import { chatApi } from './api'  // 채팅 API
import { useChatStore } from './store'  // 채팅 상태 스토어
import type { ChatMessage } from './types'  // 채팅 메시지 타입

// WebSocket URL: 환경 변수 또는 기본값
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws-stomp'

/**
 * 채팅방 훅
 * 
 * 기능:
 * - 채팅방 메시지 관리
 * - 실시간 메시지 수신 및 전송
 * - 과거 메시지 무한 스크롤
 * - WebSocket 연결 관리
 */
export function useChatRoom(roomId: number) {
  const { appendMessage, setMessages, messagesByRoom } = useChatStore()  // 채팅 스토어 함수들
  const stompRef = useRef<Client | null>(null)  // STOMP 클라이언트 참조

  // ── 과거 메시지 조회 (REST, infinite) ──────────────────────────────────────────
  const historyQuery = useInfiniteQuery({
    queryKey: ['chat', 'messages', roomId],  // 쿼리 키
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
