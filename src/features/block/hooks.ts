// 사용자 차단 — 가이드 §10.11
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/api/axios'
import { userApi } from '@/features/user/api'
import { toast } from 'sonner'
import type { UserBlock } from './types'
import type { PageResponse } from '@/shared/types'

const BLOCK_QUERY_KEYS = {
  list: (page = 0, size = 20) => ['blocks', page, size] as const,
} as const

/**
 * 차단 목록 — Page<UserBlockResponse>
 */
export function useBlockList(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: BLOCK_QUERY_KEYS.list(params?.page, params?.size),
    queryFn: () =>
      api.get<PageResponse<UserBlock>>('/api/v1/blocks', { params }).then((r) => r.data),
  })
}

/**
 * 차단 추가 (멱등) — POST /blocks { userId }
 */
export function useBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      api.post<void>('/api/v1/blocks', { userId }).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] })
      toast.success('차단되었어요.')
    },
  })
}

/**
 * 차단 해제 (멱등) — DELETE /blocks/{userId}
 */
export function useUnblock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      api.delete<void>(`/api/v1/blocks/${userId}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] })
    },
  })
}

/**
 * 사용자 신고 — POST /users/{userId}/report
 * body: { reason: 필수 ≤50, detail?: ≤5000 }
 */
export function useReportUser() {
  return useMutation({
    mutationFn: ({ userId, reason, detail }: { userId: number; reason: string; detail?: string }) =>
      userApi.report(userId, { reason, detail }),
  })
}
