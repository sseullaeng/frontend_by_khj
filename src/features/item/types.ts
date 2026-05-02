// 물품(Item) 도메인 타입 — 백엔드 §6 / PR #66 정합
import { z } from 'zod'

// ── enum 한글값 (백엔드와 동일) ───────────────────────────────────────────────

// 거래 유형
export type TradeType = '판매' | '대여' | '나눔'

// 물품 상태 (삭제는 백엔드가 자동 제외, 클라이언트가 직접 다루는 일은 거의 없음)
export type ItemStatus = '판매중' | '예약' | '거래완료' | '비공개' | '삭제'

// 마이페이지 탭 필터용 — '삭제' 제외
export type MyItemStatus = Exclude<ItemStatus, '삭제'>

// 대여 단위
export type RentalUnit = '시간' | '일' | '주' | '월'

// 정렬 옵션
export type ItemSort =
  | 'latest'
  | 'price_asc'
  | 'price_desc'
  | 'view_desc'
  | 'wishlist_desc'

// ── 응답 스키마 ──────────────────────────────────────────────────────────────

/**
 * ItemSummaryResponse — 목록·검색·찜·내물품 공통
 */
export interface Item {
  id: number
  sellerId: number
  categoryId: number | null
  title: string
  price: number
  tradeType: TradeType
  status: ItemStatus
  region: string | null
  thumbnailUrl: string | null
  wishlistCount: number
  isWishlisted: boolean   // 비로그인은 항상 false
  createdAt: string
}

/**
 * ItemDetailResponse — 상세 페이지
 */
export interface ItemImage {
  imageUrl: string
  sortOrder: number
  thumbnail: boolean
}

export interface ItemDetail extends Item {
  description: string
  deposit: number | null         // 대여 거래만, 그 외 null
  rentalUnit: RentalUnit | null  // 대여 거래만, 그 외 null
  viewCount: number
  images: ItemImage[]
  hashtags: string[]
  updatedAt: string
}

// ── 필터 ─────────────────────────────────────────────────────────────────────

export interface ItemFilter {
  q?: string                // 검색 키워드 (백엔드 인식 param)
  categoryId?: number
  tradeType?: TradeType
  minPrice?: number
  maxPrice?: number
  tag?: string
  sort?: ItemSort
  page?: number
  size?: number
}

// ── 폼 스키마 (등록/수정) ────────────────────────────────────────────────────

export const itemCreateSchema = z.object({
  title:       z.string().min(2, '제목은 2자 이상 입력해 주세요.').max(200, '제목은 200자 이하예요.'),
  description: z.string().min(10, '내용은 10자 이상 입력해 주세요.').max(5000, '내용은 5000자 이하예요.'),
  price:       z.number({ invalid_type_error: '금액을 입력해 주세요.' }).min(0, '금액은 0원 이상이어야 해요.'),
  tradeType:   z.enum(['판매', '대여', '나눔']),
  categoryId:  z.number().int().positive().optional(),
  region:      z.string().max(100, '지역은 100자 이하예요.').optional(),
  hashtags:    z.array(z.string()).max(5, '해시태그는 5개까지 가능해요.').optional(),
  imageUrls:   z.array(z.string()).max(5, '사진은 최대 5장이에요.').optional(),
  deposit:     z.number().int().min(0).optional(),    // 대여만
  rentalUnit:  z.enum(['시간', '일', '주', '월']).optional(),  // 대여만
})

export type ItemCreateRequest = z.infer<typeof itemCreateSchema>

/**
 * 수정 — title/description/price 필수, imageUrls/hashtags 는 null=유지, [...]=전체 교체
 * tradeType 은 변경 불가
 */
export interface ItemUpdateRequest {
  title: string
  description: string
  price: number
  categoryId?: number | null
  region?: string | null
  hashtags?: string[] | null
  imageUrls?: string[] | null
  deposit?: number | null
  rentalUnit?: RentalUnit | null
}

// ── 찜 응답 ──────────────────────────────────────────────────────────────────

export interface WishlistToggleResponse {
  wishlisted: boolean
  wishlistCount: number
}

// 차단된 사용자
export interface BlockedUser {
  id: number
  nickname: string
  profileImage: string | null
  blockedAt: string
}
