import api from '@/shared/api/axios'
import type { Delivery, DeliveryRequest } from './types'
import type { PageResponse } from '@/shared/types'

export const deliveryApi = {
  getList: (params?: { page?: number }) =>
    api.get<PageResponse<Delivery>>('/api/v1/deliveries', { params }),

  getDetail: (id: number) =>
    api.get<Delivery>(`/api/v1/deliveries/${id}`),

  create: (body: DeliveryRequest) =>
    api.post<Delivery>('/api/v1/deliveries', body),
}
