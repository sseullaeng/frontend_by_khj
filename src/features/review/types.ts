export interface Review {
  id: number
  roomId: number
  itemId: number
  itemTitle: string
  reviewerId: number
  revieweeId: number
  revieweeNickname: string
  rating: number
  tags: string[]
  content: string
  createdAt: string
}
