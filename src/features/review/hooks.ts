// 리뷰 훅 — 가이드 §10.12 + 라운드14 6-A (visibility)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reviewApi } from './api'
import type { Review, ReviewCreateRequest, ReviewVisibilityRequest } from './types'
import type { PageResponse } from '@/shared/types'
import { BusinessError } from '@/shared/types'
import { getErrorMessage } from '@/shared/lib/errorMessages'

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

// 라운드14 — 한줄평 공개여부 토글 (대상자 본인)
export function useUpdateReviewVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReviewVisibilityRequest }) =>
      reviewApi.patchVisibility(id, body).then((r) => r.data),
    onMutate: async ({ id, body }) => {
      // optimistic — byUser 캐시들에서 해당 review 의 contentVisible 즉시 토글
      await qc.cancelQueries({ queryKey: reviewKeys.all() })
      qc.setQueriesData<PageResponse<Review>>({ queryKey: reviewKeys.all() }, (old) => {
        if (!old || !('content' in old)) return old
        return {
          ...old,
          content: old.content.map((r) =>
            r.id === id ? { ...r, contentVisible: body.contentVisible } : r,
          ),
        }
      })
    },
    onSuccess: (updated) => {
      // 서버 응답으로 정합
      qc.setQueriesData<PageResponse<Review>>({ queryKey: reviewKeys.all() }, (old) => {
        if (!old || !('content' in old)) return old
        return {
          ...old,
          content: old.content.map((r) => (r.id === updated.id ? updated : r)),
        }
      })
      toast.success(updated.contentVisible ? '한줄평을 공개로 바꿨어요.' : '한줄평을 비공개로 바꿨어요.')
    },
    onError: (err) => {
      qc.invalidateQueries({ queryKey: reviewKeys.all() })
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code, err.message))
      else toast.error('공개 설정을 바꾸지 못했어요.')
    },
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
