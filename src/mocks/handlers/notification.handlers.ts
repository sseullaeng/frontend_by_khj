import { http, HttpResponse } from 'msw'
import type { Notification } from '@/features/notification/types'

const BASE = '/api/v1/notifications'

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'TRANSACTION',
    title: '거래가 시작됐어요',
    body: '아이폰 14 거래가 채팅 중 상태로 변경됐어요.',
    linkUrl: '/transactions/1',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 2,
    type: 'REVIEW',
    title: '리뷰가 작성됐어요',
    body: '거래 상대방이 리뷰를 남겼어요.',
    linkUrl: '/mypage',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

export const notificationHandlers = [
  http.get(BASE, () =>
    HttpResponse.json({
      success: true,
      data: {
        content: mockNotifications,
        page: 0, size: 10,
        totalElements: mockNotifications.length, totalPages: 1,
        hasNext: false, hasPrevious: false,
      },
    })
  ),

  http.patch(`${BASE}/:id/read`, ({ params }) => {
    const n = mockNotifications.find((x) => x.id === Number(params.id))
    if (n) n.isRead = true
    return HttpResponse.json({ success: true, data: null })
  }),

  http.patch(`${BASE}/read-all`, () => {
    mockNotifications.forEach((n) => { n.isRead = true })
    return HttpResponse.json({ success: true, data: null })
  }),

  http.get(`${BASE}/unread-count`, () =>
    HttpResponse.json({
      success: true,
      data: { count: mockNotifications.filter((n) => !n.isRead).length },
    })
  ),
]
