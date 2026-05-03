// 클라이언트 in-memory 리뷰 추적 — "이 거래에 대해 리뷰 남겼는지" UI 표시용.
// 백엔드 Review 타입(가이드 §10.12)과 별개.
// 추후 useUserReviews / usePendingReviews hook 으로 대체 시 제거 예정.
import { create } from 'zustand'

interface LocalReview {
  id: number
  roomId: number
  reviewerId: number
  revieweeId: number
  rating: number
  tags: string[]
  content: string
  createdAt: string
}

interface ReviewStore {
  reviews: LocalReview[]
  addReview: (review: Omit<LocalReview, 'id' | 'createdAt'>) => void
  updateReview: (id: number, data: Pick<LocalReview, 'rating' | 'tags' | 'content'>) => void
  hasReviewed: (roomId: number, reviewerId: number) => boolean
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  addReview: (review) =>
    set((s) => ({
      reviews: [
        ...s.reviews,
        { ...review, id: Date.now(), createdAt: new Date().toISOString() },
      ],
    })),
  updateReview: (id, data) =>
    set((s) => ({
      reviews: s.reviews.map((r) => r.id === id ? { ...r, ...data } : r),
    })),
  hasReviewed: (roomId, reviewerId) =>
    get().reviews.some((r) => r.roomId === roomId && r.reviewerId === reviewerId),
}))
