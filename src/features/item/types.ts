import { z } from 'zod'

export type ItemType     = 'SELL' | 'RENT' | 'SHARE'
export type ItemStatus   = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'HIDDEN'

export interface Item {
  id: number
  title: string
  description: string
  price: number
  rentPrice: number
  itemType: ItemType
  status: ItemStatus
  category: string
  brand?: string
  isEscrow: boolean
  hashtags: string[]
  imageUrls: string[]
  wishCount: number
  viewCount: number
  isWished: boolean
  sellerId: number
  sellerNickname: string
  sellerProfileImageUrl: string | null
  buyerNickname?: string | null
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
  sellPrice:   z.number({ invalid_type_error: '판매금액을 입력해 주세요.' }).min(0, '판매금액은 0원 이상이어야 해요.'),
  rentPrice:   z.number({ invalid_type_error: '대여금액을 입력해 주세요.' }).min(0, '대여금액은 0원 이상이어야 해요.'),
  depositRate: z.number({ invalid_type_error: '보증금율을 입력해 주세요.' }).min(0, '보증금율은 0% 이상이어야 해요.').max(100, '보증금율은 100% 이하이어야 해요.'),
  category:    z.string().min(1, '카테고리를 선택해 주세요.'),
  categoryName: z.string().min(1, '카테고리명을 선택해 주세요.'),
  categoryId:   z.number({ invalid_type_error: '카테고리를 선택해 주세요.' }).min(1, '카테고리를 선택해 주세요.'),
  locationName: z.string().min(1, '거래 장소를 선택해 주세요.'),
  locationLat:  z.number({ invalid_type_error: '위치 정보가 필요합니다.' }),
  locationLng:  z.number({ invalid_type_error: '위치 정보가 필요합니다.' }),
  hashtags:    z.array(z.string()).max(5, '해시태그는 5개까지 가능해요.'),
  imageFiles:  z.array(z.instanceof(File)).max(10, '사진은 최대 10장까지 가능해요.'),
  isEscrow:    z.boolean().default(false),
})

export type ItemCreateRequest = z.infer<typeof itemCreateSchema> & { imageKeys: string[] }
export type ItemUpdateRequest = Partial<ItemCreateRequest>
