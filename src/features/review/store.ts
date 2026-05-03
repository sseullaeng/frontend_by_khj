import { create } from 'zustand'
import type { Review } from './types'

interface ReviewStore {
  reviews: Review[]
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void
  updateReview: (id: number, data: Pick<Review, 'rating' | 'tags' | 'content'>) => void
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
