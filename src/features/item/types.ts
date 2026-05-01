// 물품 관련 타입: 물품 정보 및 필터링 데이터 타입 정의
import { z } from 'zod'  // Zod 스키마 라이브러리

// 물품 거래 유형: 중고거래, 대여, 나눔
export type ItemType     = 'SELL' | 'RENT' | 'SHARE'

// 물품 상태: 활성, 예약됨, 판매완료, 숨김
export type ItemStatus   = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'HIDDEN'

// 거래 상태: 진행중, 거래완료, 거래취소
export type TradeStatus  = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

/**
 * 물품 기본 정보 인터페이스
 * 
 * 물품의 모든 정보를 포함하는 기본 데이터 구조
 */
export interface Item {
  id: number                    // 물품 고유 ID
  title: string                 // 물품 제목
  description: string           // 물품 상세 설명
  price: number               // 중고거래 가격 (원)
  rentPrice: number            // 대여 가격 (원/일)
  itemType: ItemType           // 거래 유형 (중고/대여/나눔)
  status: ItemStatus           // 물품 상태 (활성/예약/판매/숨김)
  category: string             // 물품 카테고리
  brand?: string              // 브랜드 (선택사항)
  isEscrow: boolean          // 거래대행 사용 여부
  hashtags: string[]          // 해시태그 목록
  imageUrls: string[]         // 물품 이미지 URL 목록
  wishCount: number           // 찜하기 수
  viewCount: number           // 조회수
  isWished: boolean          // 현재 사용자 찜하기 여부
  sellerId: number            // 판매자 ID
  sellerNickname: string       // 판매자 닉네임
  sellerProfileImageUrl: string | null  // 판매자 프로필 이미지
  buyerNickname?: string | null    // 구매자 닉네임 (선택사항)
  createdAt: string           // 생성일시
}

// 물품 필터링 인터페이스
export interface ItemFilter {
  keyword?: string      // 검색 키워드
  category?: string     // 카테고리 필터
  itemType?: ItemType    // 거래 유형 필터
  status?: ItemStatus    // 상태 필터
  hashtag?: string      // 해시태그 필터
  minPrice?: number     // 최소 가격
  maxPrice?: number     // 최대 가격
  page?: number         // 페이지 번호
  size?: number         // 페이지 크기
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
  isEscrow:    z.boolean(),
})

// 거래 상대방 정보 인터페이스
export interface Counterpart {
  id: number                    // 상대방 ID
  nickname: string              // 상대방 닉네임
  profileImageUrl: string | null  // 상대방 프로필 이미지
  trustScore?: number           // 신뢰 지수
}

// 거래 내역 인터페이스
export interface Trade {
  id: number                    // 거래 고유 ID
  status: TradeStatus           // 거래 상태
  isBuyer: boolean             // 현재 사용자가 구매자인지 여부 (true: 구매, false: 판매)
  item: Item                   // 거래된 물품 정보
  counterpart: Counterpart     // 거래 상대방 정보
  location?: string            // 거래 장소
  createdAt: string            // 거래 생성일시
  completedAt?: string         // 거래 완료일시
}

export type ItemCreateRequest = z.infer<typeof itemCreateSchema> & { imageKeys: string[] }
export type ItemUpdateRequest = Partial<ItemCreateRequest>
