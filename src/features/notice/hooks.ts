import { useQuery } from '@tanstack/react-query'
import { noticeApi } from './api'
import type { NoticeType } from './api'

export const noticeKeys = {
  all:    ()                                  => ['notices'] as const,
  list:   (type?: NoticeType, page = 0)       => [...noticeKeys.all(), 'list', type ?? 'all', page] as const,
  detail: (id: number)                        => [...noticeKeys.all(), 'detail', id] as const,
}

export function useNotices(params?: { type?: NoticeType; page?: number; size?: number }) {
  return useQuery({
    queryKey: noticeKeys.list(params?.type, params?.page),
    queryFn: () => noticeApi.list(params).then((r) => r.data),
  })
}

export function useNoticeDetail(id: number) {
  return useQuery({
    queryKey: noticeKeys.detail(id),
    queryFn: () => noticeApi.detail(id).then((r) => r.data),
    enabled: !!id,
  })
}
