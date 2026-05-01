import { create } from 'zustand'
import type { Review } from './types'

interface ReviewStore {
  reviews: Review[]
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void
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
  hasReviewed: (roomId, reviewerId) =>
    get().reviews.some((r) => r.roomId === roomId && r.reviewerId === reviewerId),
}))
