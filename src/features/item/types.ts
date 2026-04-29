import { z } from 'zod'

export type ItemType     = 'SELL' | 'RENT' | 'SHARE'
export type ItemStatus   = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'HIDDEN'

export interface Item {
  id: number
  title: string
  description: string
  price: number
  itemType: ItemType
  status: ItemStatus
  category: string
  hashtags: string[]
  imageUrls: string[]
  wishCount: number
  viewCount: number
  isWished: boolean
  sellerId: number
  sellerNickname: string
  sellerProfileImageUrl: string | null
  createdAt: string
}

export interface ItemFilter {
  keyword?: string
  category?: string
  itemType?: ItemType
  status?: ItemStatus
  hashtag?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  size?: number
}

export const itemCreateSchema = z.object({
  title:       z.string().min(2, '제목은 2자 이상 입력해 주세요.').max(40),
  description: z.string().min(10, '내용은 10자 이상 입력해 주세요.'),
  price:       z.number().min(0, '가격은 0원 이상이어야 해요.'),
  itemType:    z.enum(['SELL', 'RENT', 'SHARE']),
  category:    z.string().min(1, '카테고리를 선택해 주세요.'),
  hashtags:    z.array(z.string()).max(5, '해시태그는 5개까지 가능해요.'),
})

export type ItemCreateRequest = z.infer<typeof itemCreateSchema> & { imageKeys: string[] }
export type ItemUpdateRequest = Partial<ItemCreateRequest>
