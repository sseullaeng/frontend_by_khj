import api from '@/shared/api/axios'
import type { Notification } from './types'
import type { PageResponse } from '@/shared/types'

export const notificationApi = {
  getList: (params: { page?: number; size?: number }) =>
    api.get<PageResponse<Notification>>('/api/v1/notifications', { params }),

  markRead: (id: number) =>
    api.patch<void>(`/api/v1/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<void>('/api/v1/notifications/read-all'),

  getUnreadCount: () =>
    api.get<{ count: number }>('/api/v1/notifications/unread-count'),
}
