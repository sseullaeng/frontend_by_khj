// 리뷰 API — 가이드 §10.12
import api from '@/shared/api/axios'
import type { PendingReview, Review, ReviewCreateRequest } from './types'
import type { PageResponse } from '@/shared/types'

export const reviewApi = {
  // 작성 — 거래완료 7일 이내, 참여자만
  create: (body: ReviewCreateRequest) =>
    api.post<{ id: number }>('/api/v1/reviews', body),

  // 특정 사용자가 받은 리뷰 (reviewee 기준)
  // ⚠️ comment 는 본인 조회시에만 값, 타인은 null
  getByUser: (userId: number, params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Review>>(`/api/v1/users/${userId}/reviews`, { params }),

  // 작성 대기 — 본인이 reviewer 로 아직 안 쓴 7일 이내 완료 거래
  getPending: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<PendingReview>>('/api/v1/reviews/pending', { params }),
}
