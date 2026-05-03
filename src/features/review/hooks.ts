// 리뷰 훅 — 가이드 §10.12
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reviewApi } from './api'
import type { ReviewCreateRequest } from './types'
import { BusinessError } from '@/shared/types'

export const reviewKeys = {
  all:     ()                                    => ['reviews'] as const,
  byUser:  (userId: number, page = 0, size = 20) => [...reviewKeys.all(), 'user', userId, page, size] as const,
  pending: (page = 0, size = 20)                 => [...reviewKeys.all(), 'pending', page, size] as const,
}

export function useUserReviews(userId: number | undefined, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: reviewKeys.byUser(userId ?? 0, params?.page ?? 0, params?.size ?? 20),
    queryFn: () => reviewApi.getByUser(userId!, params).then((r) => r.data),
    enabled: !!userId,
  })
}

export function usePendingReviews(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: reviewKeys.pending(params?.page ?? 0, params?.size ?? 20),
    queryFn: () => reviewApi.getPending(params).then((r) => r.data),
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReviewCreateRequest) => reviewApi.create(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all() })
      toast.success('리뷰가 작성됐어요!')
    },
    onError: (err) => {
      if (err instanceof BusinessError) {
        if (err.code === 'REVIEW_DUPLICATED') toast.error('이미 작성한 리뷰가 있어요.')
        else if (err.code === 'REVIEW_PERIOD_EXPIRED') toast.error('리뷰 작성 기간(7일)이 지났어요.')
        else toast.error(err.message)
      } else {
        toast.error('리뷰 작성에 실패했어요.')
      }
    },
  })
}
