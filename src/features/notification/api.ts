// 알림 API — 가이드 §10.10
//
// 백엔드 spec 에 명시된 endpoint 2개만:
//   GET /api/v1/notifications
//   PATCH /api/v1/notifications/{id}/read   (id 는 String — ObjectId hex)
//
// "모두 읽음" / "안 읽은 개수" 별도 endpoint 미명시 → 클라가 처리.
import api from '@/shared/api/axios'
import type { Notification } from './types'
import type { PageResponse } from '@/shared/types'

export const notificationApi = {
  getList: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Notification>>('/api/v1/notifications', { params }),

  // ⚠️ id 는 string (MongoDB ObjectId hex)
  markRead: (id: string) =>
    api.patch<void>(`/api/v1/notifications/${id}/read`),
}
