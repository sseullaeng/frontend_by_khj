// 물품(Item) 도메인 타입 — 백엔드 §6 / PR #66 정합
import { z } from 'zod'

// ── enum 한글값 (백엔드와 동일) ───────────────────────────────────────────────

// 거래 유형
export type TradeType = '판매' | '대여' | '나눔'

// 라운드13 PR-G — 보증금 타입 (대여 거래에만 적용)
//   AMOUNT  : deposit 값을 원 단위 금액 그대로 사용
//   PERCENT : deposit 값을 rentalPrice 의 % 로 사용. 거래 hold 시 Math.ceil(rentalPrice * pct / 100)
export type DepositType = 'AMOUNT' | 'PERCENT'

// 물품 상태 (삭제는 백엔드가 자동 제외, 클라이언트가 직접 다루는 일은 거의 없음)
export type ItemStatus = '판매중' | '예약' | '거래완료' | '비공개' | '삭제'

// 마이페이지 탭 필터용 — '삭제' 제외
export type MyItemStatus = Exclude<ItemStatus, '삭제'>

// 대여 단위
export type RentalUnit = '시간' | '일' | '주' | '월'

// 정렬 옵션 (단일 키)
//   라운드14 — completed_last (거래완료 후순위) 추가
//   ItemFilter.sort 는 CSV 다중키도 받음 (예: 'wishlist_desc,view_desc,latest').
//   마지막에 id desc 자동 tiebreak 부착, 무효 토큰 무시.
export type ItemSort =
  | 'latest'
  | 'price_asc'
  | 'price_desc'
  | 'view_desc'
  | 'wishlist_desc'
  | 'completed_last'

// ── 응답 스키마 ──────────────────────────────────────────────────────────────

/**
 * ItemSummaryResponse — 목록·검색·찜·내물품 공통
 *
 * 라운드13 PR #118 — 판매·대여 동시 등록 지원.
 *   응답에 tradeTypes / salePrice / rentalPrice 신규 필드. legacy tradeType / price 도 같이 옴 (primary 모드 기준).
 *   신규 코드는 tradeTypes / salePrice / rentalPrice 사용 권장.
 */
export interface Item {
  id: number
  sellerId: number
  categoryId: number | null
  title: string
  status: ItemStatus
  region: string | null
  hashtags?: string[]     // ItemSummary 응답에 포함 (없는 환경 대비 옵셔널)
  thumbnailUrl: string | null
  wishlistCount: number
  isWishlisted: boolean   // 비로그인은 항상 false
  viewCount: number       // 라운드13 PR #115 — Summary 응답에 추가
  rentalActive?: boolean  // 현재 실제 대여중 여부. tradeTypes 의 대여 지원 여부와 분리.
  rentalAvailable?: boolean // 현재 대여 신청 가능 여부. 대여 버튼 활성화 기준.

  // 라운드13 PR #118 — 이중 등록
  tradeTypes:  TradeType[]      // ["판매"], ["대여"], ["나눔"], ["판매","대여"] 가능
  salePrice:   number | null    // 판매 가격 (판매 포함 시)
  rentalPrice: number | null    // 대여 단가 (대여 포함 시)

  // legacy — primary 모드(판매>대여>나눔) 기준. 점진 마이그레이션 예정.
  tradeType: TradeType
  price:     number

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
  // 대여 거래만 값 — depositType 으로 값 의미 분기 (AMOUNT=원 / PERCENT=%)
  //   서버가 거래 생성 시 환산: PERCENT 면 Math.ceil(rentalPrice × pct / 100)
  deposit:     number | null
  depositType: DepositType | null  // 라운드13 PR-G
  rentalUnit:  RentalUnit | null   // 대여 거래만, 그 외 null
  images: ItemImage[]
  hashtags: string[]
  updatedAt: string
}

// ── 필터 ─────────────────────────────────────────────────────────────────────

export interface ItemFilter {
  q?: string                // 검색 키워드 (백엔드 인식 param)
  categoryId?: number
  sellerId?: number         // 라운드9 — 특정 판매자 물품
  tradeType?: TradeType
  minPrice?: number
  maxPrice?: number
  tag?: string
  // ItemSort 단일 또는 CSV (예: 'wishlist_desc,view_desc,latest').
  sort?: ItemSort | string
  page?: number
  size?: number
}

// ── 폼 스키마 (등록/수정) — 라운드13 PR #118 + PR-G ──────────────────────────
//
// 모드별 필수:
//   판매 ∈ tradeTypes → salePrice
//   대여 ∈ tradeTypes → rentalPrice + rentalUnit + deposit + depositType
//   나눔 ∈ tradeTypes → 가격 필드 무시
//   나눔은 판매/대여와 동시 선택 불가 (백엔드는 허용하나 UI 가드)

export const itemCreateSchema = z.object({
  title:       z.string().min(2, '제목은 2자 이상 입력해 주세요.').max(200, '제목은 200자 이하예요.'),
  description: z.string().min(10, '내용은 10자 이상 입력해 주세요.').max(5000, '내용은 5000자 이하예요.'),
  tradeTypes:  z.array(z.enum(['판매', '대여', '나눔'])).min(1, '거래 방식을 1개 이상 선택해 주세요.'),
  categoryId:  z.number().int().positive().optional(),
  region:      z.string().max(100, '지역은 100자 이하예요.').optional(),
  hashtags:    z.array(z.string()).max(5, '해시태그는 5개까지 가능해요.').optional(),
  imageUrls:   z.array(z.string()).max(10, '사진은 최대 10장이에요.').optional(),

  // 라운드13 PR #118 — 모드별 가격
  salePrice:   z.number().int().min(0).optional(),
  rentalPrice: z.number().int().min(0).optional(),
  rentalUnit:  z.enum(['시간', '일', '주', '월']).optional(),
  deposit:     z.number().int().min(0).optional(),
  depositType: z.enum(['AMOUNT', 'PERCENT']).optional(),
}).superRefine((v, ctx) => {
  const has = (t: TradeType) => v.tradeTypes.includes(t)
  if (has('나눔') && (has('판매') || has('대여'))) {
    ctx.addIssue({ code: 'custom', path: ['tradeTypes'], message: '나눔은 단독으로만 선택 가능해요.' })
  }
  if (has('판매') && (v.salePrice == null || v.salePrice <= 0)) {
    ctx.addIssue({ code: 'custom', path: ['salePrice'], message: '판매 가격을 입력해 주세요.' })
  }
  if (has('대여')) {
    if (v.rentalPrice == null || v.rentalPrice <= 0) {
      ctx.addIssue({ code: 'custom', path: ['rentalPrice'], message: '대여 단가를 입력해 주세요.' })
    }
    if (!v.rentalUnit) {
      ctx.addIssue({ code: 'custom', path: ['rentalUnit'], message: '대여 단위를 선택해 주세요.' })
    }
    if (v.deposit == null) {
      ctx.addIssue({ code: 'custom', path: ['deposit'], message: '보증금을 입력해 주세요.' })
    }
    if (!v.depositType) {
      ctx.addIssue({ code: 'custom', path: ['depositType'], message: '보증금 단위를 선택해 주세요.' })
    }
    if (v.depositType === 'PERCENT' && v.deposit != null && (v.deposit < 1 || v.deposit > 100)) {
      ctx.addIssue({ code: 'custom', path: ['deposit'], message: '퍼센트는 1~100 사이로 입력해 주세요.' })
    }
  }
})

export type ItemCreateRequest = z.infer<typeof itemCreateSchema>

/**
 * 수정 — title/description 필수, imageUrls/hashtags 는 null=유지, [...]=전체 교체
 * tradeTypes 도 변경 가능 (백엔드 허용)
 */
export interface ItemUpdateRequest {
  title:       string
  description: string
  categoryId?: number | null
  region?:     string | null
  hashtags?:   string[] | null
  imageUrls?:  string[] | null

  // 라운드13 PR #118 — 이중 등록
  tradeTypes:  TradeType[]
  salePrice?:  number | null
  rentalPrice?: number | null
  rentalUnit?: RentalUnit | null
  deposit?:    number | null
  depositType?: DepositType | null
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
