// 차단 관련 훅: 차단 목록 조회 및 차단 해제 기능 (UC-12)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'  // React Query 훅
import { api } from '@/shared/api/axios'  // API 클라이언트
import type { BlockedUser } from '@/features/item/types'  // 차단된 사용자 타입

// 차단 관련 쿼리 키 상수
const BLOCK_QUERY_KEYS = {
  list: ['block-list'] as const,  // 차단 목록 쿼리 키
} as const

/**
 * 차단 목록 조회 훅
 * GET /api/v1/blocks
 * @returns 차단된 사용자 목록 및 로딩 상태
 */
export function useBlockList() {
  return useQuery({
    queryKey: BLOCK_QUERY_KEYS.list,
    queryFn: async (): Promise<BlockedUser[]> => {
      const { data } = await api.get('/api/v1/blocks')
      return data
    },
  })
}

/**
 * 차단 해제 뮤테이션 훅
 * DELETE /api/v1/blocks/:userId
 * @returns 차단 해제 실행 함수 및 실행 상태
 */
export function useUnblock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      await api.delete(`/api/v1/blocks/${userId}`)
    },
    onSuccess: () => {
      // 차단 해제 후 목록 갱신
      queryClient.invalidateQueries({ queryKey: BLOCK_QUERY_KEYS.list })
    },
  })
}

/**
 * 사용자 신고 뮤테이션 훅
 * POST /api/v1/reports/:userId
 * @returns 신고 실행 함수 및 실행 상태
 */
export function useReportUser() {
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }): Promise<void> => {
      await api.post(`/api/v1/reports/${userId}`, { reason })
    },
  })
}
