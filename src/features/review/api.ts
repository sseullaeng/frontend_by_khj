// 리뷰 API — 가이드 §10.12 + 라운드14 6-A (visibility)
import api from '@/shared/api/axios'
import type {
  PendingReview,
  Review,
  ReviewCreateRequest,
  ReviewVisibilityRequest,
} from './types'
import type { PageResponse } from '@/shared/types'

export const reviewApi = {
  // 작성 — 거래완료 7일 이내, 참여자만
  create: (body: ReviewCreateRequest) =>
    api.post<{ id: number }>('/api/v1/reviews', body),

  // 특정 사용자가 받은 리뷰 (reviewee 기준)
  // ⚠️ comment 는 작성자/대상자 view 만 원본, 제3자 + contentVisible=false 면 null
  getByUser: (userId: number, params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Review>>(`/api/v1/users/${userId}/reviews`, { params }),

  // 작성 대기 — 본인이 reviewer 로 아직 안 쓴 7일 이내 완료 거래
  getPending: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<PendingReview>>('/api/v1/reviews/pending', { params }),

  // 라운드14 — 한줄평 공개여부 토글 (대상자만)
  patchVisibility: (id: number, body: ReviewVisibilityRequest) =>
    api.patch<Review>(`/api/v1/reviews/${id}/visibility`, body),
}
