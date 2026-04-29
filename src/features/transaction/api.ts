import api from '@/shared/api/axios'
import type { Transaction, TransactionStatus } from './types'
import type { PageResponse } from '@/shared/types'

export const transactionApi = {
  getList: (params?: { status?: TransactionStatus; page?: number }) =>
    api.get<PageResponse<Transaction>>('/api/v1/transactions', { params }),

  getDetail: (id: number) =>
    api.get<Transaction>(`/api/v1/transactions/${id}`),

  start: (itemId: number) =>
    api.post<Transaction>('/api/v1/transactions', { itemId }),

  updateStatus: (id: number, status: TransactionStatus) =>
    api.patch<Transaction>(`/api/v1/transactions/${id}/status`, { status }),
}
