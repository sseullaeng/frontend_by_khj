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
  title:       z.string().min(2, '제목은 2자 이상 입력해 주세요.').max(40, '제목은 40자 이내로 입력해 주세요.'),
  description: z.string().min(10, '내용은 10자 이상 입력해 주세요.').max(2000, '내용은 2000자 이내로 입력해 주세요.'),
  price:       z.number({ invalid_type_error: '가격을 입력해 주세요.' }).min(0, '가격은 0원 이상이어야 해요.'),
  itemType:    z.enum(['SELL', 'RENT', 'SHARE'], { errorMap: () => ({ message: '거래 방식을 선택해 주세요.' }) }),
  category:    z.string().min(1, '카테고리를 선택해 주세요.').max(20, '카테고리는 20자 이내로 입력해 주세요.'),
  hashtags:    z.array(z.string()).max(5, '해시태그는 5개까지 가능해요.'),
})

export type ItemCreateRequest = z.infer<typeof itemCreateSchema> & { imageKeys: string[] }
export type ItemUpdateRequest = Partial<ItemCreateRequest>
