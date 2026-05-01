import api from '@/shared/api/axios'
import type { Item, ItemCreateRequest, ItemFilter, ItemUpdateRequest } from './types'
import type { PageResponse } from '@/shared/types'

export const itemApi = {
  getList:  (filter: ItemFilter) =>
    api.get<PageResponse<Item>>('/api/v1/items', { params: filter }),

  getDetail: (id: number) =>
    api.get<Item>(`/api/v1/items/${id}`),

  create: (body: ItemCreateRequest) =>
    api.post<Item>('/api/v1/items', body),

  update: (id: number, body: ItemUpdateRequest) =>
    api.patch<Item>(`/api/v1/items/${id}`, body),

  delete: (id: number) =>
    api.delete<void>(`/api/v1/items/${id}`),

  toggleWish: (id: number) =>
    api.post<{ isWished: boolean }>(`/api/v1/items/${id}/wish`),

  getWishList: () =>
    api.get<PageResponse<Item>>('/api/v1/items/wished'),

  getMyItems: () =>
    api.get<PageResponse<Item>>('/api/v1/items/my'),

  report: (id: number, reason: string) =>
    api.post<void>(`/api/v1/items/${id}/report`, { reason }),

  // Presigned URL 발급
  getPresignedUrls: (files: { name: string; contentType: string; size: number }[]) =>
    api.post<{ uploads: { presignedUrl: string; key: string }[] }>(
      '/api/v1/files/presigned-url',
      { purpose: 'item', files }
    ),
}
