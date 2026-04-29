/**
 * Chat MSW 핸들러
 * ⚠️ WebSocket(STOMP)은 MSW mock 불가 — REST 부분만 mock
 */
import { http, HttpResponse } from 'msw'
import type { ChatRoom, ChatMessage } from '@/features/chat/types'

const BASE = '/api/v1/chat-rooms'

const mockRooms: ChatRoom[] = [
  {
    id: 1,
    itemId: 1,
    itemTitle: '아이폰 14',
    itemImageUrl: null,
    opponentId: 2,
    opponentNickname: '판매자A',
    opponentProfileImageUrl: null,
    lastMessage: '안녕하세요! 아직 판매 중인가요?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 2,
  },
]

const mockMessages: ChatMessage[] = [
  {
    id: 1,
    roomId: 1,
    senderId: 2,
    content: '안녕하세요! 아직 판매 중인가요?',
    imageUrl: null,
    sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
]

export const chatHandlers = [
  http.get(BASE, () =>
    HttpResponse.json({ success: true, data: mockRooms })
  ),

  http.get(`${BASE}/:id`, ({ params }) => {
    const room = mockRooms.find((r) => r.id === Number(params.id))
    if (!room) return HttpResponse.json({ success: false, error: { code: 'CHAT_ROOM_NOT_FOUND', message: '채팅방 없음', traceId: 'mock' } }, { status: 404 })
    return HttpResponse.json({ success: true, data: room })
  }),

  http.get(`${BASE}/:id/messages`, ({ params }) => {
    const msgs = mockMessages.filter((m) => m.roomId === Number(params.id))
    return HttpResponse.json({
      success: true,
      data: {
        content: msgs,
        page: 0, size: 30,
        totalElements: msgs.length, totalPages: 1,
        hasNext: false, hasPrevious: false,
      },
    })
  }),

  http.post(BASE, async ({ request }) => {
    const body = await request.json() as { itemId: number }
    const newRoom: ChatRoom = {
      id: mockRooms.length + 1,
      itemId: body.itemId,
      itemTitle: '상품',
      itemImageUrl: null,
      opponentId: 99,
      opponentNickname: '상대방',
      opponentProfileImageUrl: null,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
    }
    mockRooms.push(newRoom)
    return HttpResponse.json({ success: true, data: newRoom }, { status: 201 })
  }),
]
