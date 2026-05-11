// 알림 API — 가이드 §10.10 + 라운드9 (한글 enum 매핑 + read-all)
//
// 백엔드 응답:
//   - type: 한글 enum (메시지/거래/리뷰/공지/시스템)
//   - linkType: 소문자 하이픈 (chat-room/transaction/delivery/item/review/payment/inquiry)
// 프론트는 영문 대문자 enum → 응답 단계에서 매핑.
import api from '@/shared/api/axios'
import type { Notification, NotificationCategory, NotificationType, NotificationLinkType } from './types'
import type { PageResponse } from '@/shared/types'

// 라운드13 PR #116 — 백엔드가 영문 enum 으로 보내므로 통과. 미인식 값은 USER 로 폴백.
const CATEGORY_SET = new Set<NotificationCategory>(['SYSTEM', 'REPORT', 'INQUIRY', 'USER'])
const normalizeCategory = (c: string | undefined | null): NotificationCategory =>
  c && CATEGORY_SET.has(c as NotificationCategory) ? (c as NotificationCategory) : 'USER'

const TYPE_MAP: Record<string, NotificationType> = {
  '시스템': 'SYSTEM',
  '메시지': 'MESSAGE',
  '거래':   'TRANSACTION',
  '리뷰':   'REVIEW',
  '공지':   'NOTICE',
  // 영문도 통과 (defensive)
  'SYSTEM':      'SYSTEM',
  'MESSAGE':     'MESSAGE',
  'CHAT':        'CHAT',
  'TRANSACTION': 'TRANSACTION',
  'REVIEW':      'REVIEW',
  'DELIVERY':    'DELIVERY',
  'POINT':       'POINT',
  'NOTICE':      'NOTICE',
}

const LINK_TYPE_MAP: Record<string, NotificationLinkType> = {
  'chat-room':   'CHAT_ROOM',
  'transaction': 'TRANSACTION',
  'delivery':    'DELIVERY',
  'item':        'ITEM',
  'review':      'REVIEW',
  'payment':     'PAYMENT',
  'inquiry':     'INQUIRY',
  // 영문도 통과
  'CHAT_ROOM':   'CHAT_ROOM',
  'ITEM':        'ITEM',
  'PAYMENT':     'PAYMENT',
  'INQUIRY':     'INQUIRY',
}

interface RawNotification {
  id: string
  type: string
  category?: string | null      // 라운드13 PR #116
  title: string
  content: string
  linkType: string | null
  linkId: number | null
  read: boolean
  createdAt: string
}

const normalize = (n: RawNotification): Notification => ({
  id: n.id,
  type: TYPE_MAP[n.type] ?? 'SYSTEM',
  category: normalizeCategory(n.category),
  title: n.title,
  content: n.content,
  linkType: n.linkType ? (LINK_TYPE_MAP[n.linkType] ?? null) : null,
  linkId: n.linkId,
  read: n.read,
  createdAt: n.createdAt,
})

const normalizePage = (page: PageResponse<RawNotification>): PageResponse<Notification> => ({
  ...page,
  content: page.content.map(normalize),
})

export const notificationApi = {
  getList: (params?: { page?: number; size?: number }) =>
    api
      .get<PageResponse<RawNotification>>('/api/v1/notifications', { params })
      .then((r) => ({ ...r, data: normalizePage(r.data) })),

  // id 는 string (MongoDB ObjectId hex)
  markRead: (id: string) =>
    api.patch<void>(`/api/v1/notifications/${id}/read`),

  // 라운드9: 전체 읽음 (응답 { updated: N })
  markAllRead: () =>
    api.patch<{ updated: number }>('/api/v1/notifications/read-all'),
}
