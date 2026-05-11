// 채팅 훅 — REST 메시지 전송 + STOMP 실시간 수신 (가이드 §9 / §10.4-5)
import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatApi } from './api'
import { useChatStore } from './store'
import type { ChatMessage, ChatRoom, SendMessageRequest } from './types'
import { subscribeStomp } from '@/shared/lib/stomp'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'

const ROOM_TOPIC = (id: number) => `/topic/chat-room/${id}`

export const chatKeys = {
  rooms:    ()                 => ['chat', 'rooms'] as const,
  room:     (id: number)       => ['chat', 'room', id] as const,
  messages: (id: number)       => ['chat', 'messages', id] as const,
}

// 채팅방 목록 (페이지네이션)
export function useChatRooms(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: [...chatKeys.rooms(), params ?? {}],
    queryFn: () => chatApi.getRooms(params).then((r) => r.data),
  })
}

// 채팅방 단건
export function useChatRoom(id: number) {
  return useQuery({
    queryKey: chatKeys.room(id),
    queryFn: () => chatApi.getRoom(id).then((r) => r.data),
    enabled: !!id,
  })
}

// 채팅방 생성 (멱등)
export function useCreateChatRoom() {
  return useMutation({
    mutationFn: (itemId: number) => chatApi.createRoom(itemId).then((r) => r.data),
  })
}

// 라운드12 — 채팅방 나가기. 본인 채팅방 목록에서 사라지고 상대 화면엔 opponentLeft=true 로 보임.
export function useLeaveChatRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roomId: number) => chatApi.leave(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.rooms() })
    },
  })
}

// 읽음 처리
export function useMarkChatRead(roomId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => chatApi.markRead(roomId).then((r) => r.data),
    onSuccess: (room) => {
      qc.setQueryData(chatKeys.room(roomId), room)
      qc.invalidateQueries({ queryKey: chatKeys.rooms() })
    },
  })
}

/**
 * 채팅방 메시지 — 초기 REST + STOMP 실시간 + REST 전송 (가이드 §9.3: send 는 REST 만)
 *
 * - 마운트 시 메시지 history (커서 페이징, before = ObjectId hex string)
 * - /topic/chat-room/{id} 구독 → 실시간 수신
 * - 진입 시 markRead 자동 호출
 * - 새 메시지 수신 시 markRead 호출 (현재 방 보고 있는 동안 unread 누적 방지)
 */
export function useChatMessages(roomId: number) {
  const qc = useQueryClient()
  const { appendMessage, setMessages, messagesByRoom } = useChatStore()
  const { mutate: markRead } = useMarkChatRead(roomId)

  // 과거 메시지 — List<MessageResponse> 응답, 커서는 가장 오래된 메시지의 id
  const historyQuery = useInfiniteQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      chatApi.getMessages(roomId, { before: pageParam, size: 30 }).then((r) => r.data),
    getNextPageParam: (last) => {
      // 응답이 size 보다 적으면 더 없음. 아니면 가장 오래된 메시지의 id (== 첫 element)
      if (!last || last.length === 0) return undefined
      return last.length < 30 ? undefined : last[0]?.id
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!roomId,
  })

  // history 도착 시 store 에 반영 — 백엔드는 최신순 (DESC), reverse 하여 오래된→최신
  useEffect(() => {
    if (!historyQuery.data) return
    const all = (historyQuery.data as InfiniteData<ChatMessage[]>).pages
      .flatMap((page) => page)
      .reverse()
    setMessages(roomId, all)
  }, [historyQuery.data, roomId, setMessages])

  // 진입 시 markRead
  useEffect(() => {
    if (!roomId) return
    markRead()
  }, [roomId, markRead])

  // STOMP 실시간 구독
  useEffect(() => {
    if (!roomId) return
    const unsubscribe = subscribeStomp(ROOM_TOPIC(roomId), (frame) => {
      try {
        const msg: ChatMessage = JSON.parse(frame.body)
        appendMessage(roomId, msg)
        // 채팅방 목록(lastMessage) 갱신
        qc.invalidateQueries({ queryKey: chatKeys.rooms() })
        // 현재 방 보는 동안 도착한 메시지는 즉시 읽음 처리
        markRead()
      } catch (err) {
        console.error('chat message parse error', err)
      }
    })
    return unsubscribe
  }, [roomId, appendMessage, qc, markRead])

  // 메시지 전송 — REST (가이드 §9.3)
  const sendMutation = useMutation({
    mutationFn: (body: SendMessageRequest) =>
      chatApi.sendMessage(roomId, body).then((r) => r.data),
    // STOMP broadcast 가 자기 자신에게도 오므로 onSuccess 에서 append 안 함 (중복 방지)
    onError: (err) => {
      if (err instanceof BusinessError) {
        toast.error(getErrorMessage(err.code))
        // 라운드12 — leave 가드. 채팅방 응답 갱신해서 UI 가 disable 되도록.
        if (err.code === 'CHAT_ROOM_OPPONENT_LEFT' || err.code === 'CHAT_FORBIDDEN') {
          qc.invalidateQueries({ queryKey: chatKeys.rooms() })
          qc.invalidateQueries({ queryKey: chatKeys.room(roomId) })
        }
      } else {
        toast.error('메시지를 보내지 못했어요.')
      }
    },
  })

  const sendMessage = (content: string, imageUrls?: string[]) => {
    const trimmed = content.trim()
    const hasImages = imageUrls && imageUrls.length > 0
    if (!trimmed && !hasImages) return
    sendMutation.mutate({
      content: trimmed || undefined,
      imageUrls: hasImages ? imageUrls : undefined,
    })
  }

  return {
    messages: messagesByRoom[roomId] ?? [],
    historyQuery,
    sendMessage,
    isSending: sendMutation.isPending,
  }
}

export type { ChatRoom }
