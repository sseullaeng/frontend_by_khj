// 메인 홈페이지 컴포넌트: 배너 슬라이더와 추천 상품 그리드를 표시하는 메인 페이지
import { useState } from 'react'
import BannerSlider from '@/shared/ui/BannerSlider'  // 배너 슬라이더 컴포넌트
import ItemCard from '@/features/item/components/ItemCard'  // 물품 카드 컴포넌트
import { itemApi } from '@/features/item/api'  // 물품 API
import { useQuery } from '@tanstack/react-query'  // React Query 훅
import type { Item } from '@/features/item/types'  // 물품 타입

const PAGE_SIZE = 6  // 한 번에 표시할 아이템 수

// 샘플 배너 데이터: 이벤트 및 공지사항 배너
const sampleBanners = [
  {
    id: 1,
    title: '🎉 쓸랭 오픈 기념 이벤트',
    description: '첫 거래 시 포인트 1000원 지급!',
    imageUrl: '/banner1.png',     // 배너 이미지 (public/banner1.png)
    linkUrl: '/notices/1',        // 클릭 시 이벤트 상세로 이동
    backgroundColor: '#6366f1',
  },
  {
    id: 2,
    title: '🌱 지구살리기 나눔 챌린지',
    description: '안 쓰는 물건 나누고 포인트 받자',
    backgroundColor: '#10b981',
    linkUrl: '/notices',
  },
  {
    id: 3,
    title: '📦 배달대행 서비스 오픈',
    description: '동네 배달대행 최대 30% 할인',
    backgroundColor: '#f59e0b',
    linkUrl: '/notices',
  },
]

/**
 * 메인 홈 페이지 컴포넌트
 * 
 * 기능:
 * - 배너 슬라이더: 이벤트/공지사항 배너 자동 재생 및 수동 제어
 * - 상품 그리드: 추천 상품 2열 그리드로 표시
 * - 더보기 버튼: 전체 상품 보기로 이동
 * - 반응형 디자인: 모바일과 데스크톱 모두 지원
 * 
 * 데이터 흐름:
 * 1. 배너: 샘플 데이터 사용 (향후 CMS 연동 예정)
 * 2. 상품: API를 통해 추천 상품 6개 조회
 * 3. 상태 관리: React Query로 데이터 캐싱 및 로딩 상태 관리
 */
export default function HomePage() {
  // 표시할 아이템 수 (더보기 클릭 시 PAGE_SIZE씩 증가)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  // 추천 상품 데이터 조회 (실제 API 연동 시 활성화)
  const { data: itemsData } = useQuery({
    queryKey: ['items', { page: 1, size: 6 }],  // 쿼리 키: 페이지와 사이즈
    queryFn: () => itemApi.getList({ page: 1, size: 6 }),  // API 호출 함수
    // 개발 단계에서는 비활성화
    enabled: false
  })

  // 샘플 데이터 (개발용)
  const sampleItems: Item[] = [
    {
      id: 1,
      title: '아이폰 14 프로 256GB',
      description: '1년 사용한 아이폰 14 프로입니다. 상태 매우 좋습니다.',
      price: 800000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'electronics',
      isEscrow: false,
      hashtags: ['애플', '아이폰', '스마트폰'],
      imageUrls: [],
      wishCount: 23,
      viewCount: 156,
      isWished: false,
      sellerId: 1,
      sellerNickname: '김민준',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-20T10:00:00Z'
    },
    {
      id: 2,
      title: '나이키 조던 1 레트로',
      description: '새상품 나이키 조던 1 레트로 사이즈 270입니다.',
      price: 150000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'fashion',
      isEscrow: false,
      hashtags: ['나이키', '조던', '신발'],
      imageUrls: [],
      wishCount: 45,
      viewCount: 289,
      isWished: true,
      sellerId: 2,
      sellerNickname: '이서아',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-19T15:30:00Z'
    },
    {
      id: 3,
      title: '삼성 노트북 갤럭시 북3',
      description: '삼성 갤럭시 북3 15인치 대여 가능합니다.',
      price: 0,
      rentPrice: 5000,
      itemType: 'RENT',
      status: 'ACTIVE',
      category: 'electronics',
      isEscrow: false,
      hashtags: ['삼성', '노트북', '대여'],
      imageUrls: [],
      wishCount: 12,
      viewCount: 78,
      isWished: false,
      sellerId: 3,
      sellerNickname: '박지호',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-18T09:15:00Z'
    },
    {
      id: 4,
      title: '아기 옷 50세트 나눔',
      description: '다 큰 아기 옷들 깨끗하게 세탁해서 나눔합니다.',
      price: 0,
      rentPrice: 0,
      itemType: 'SHARE',
      status: 'ACTIVE',
      category: 'baby',
      isEscrow: false,
      hashtags: ['아기옷', '나눔', '육아용품'],
      imageUrls: [],
      wishCount: 67,
      viewCount: 412,
      isWished: true,
      sellerId: 4,
      sellerNickname: '최하은',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-17T14:20:00Z'
    },
    {
      id: 5,
      title: '갤럭시 S24 울트라',
      description: '개봉 3일된 갤럭시 S24 울트라 512GB',
      price: 1200000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'electronics',
      isEscrow: false,
      hashtags: ['삼성', '갤럭시', '스마트폰'],
      imageUrls: [],
      wishCount: 89,
      viewCount: 523,
      isWished: false,
      sellerId: 5,
      sellerNickname: '정현우',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-16T11:45:00Z'
    },
    {
      id: 6,
      title: '에어팟 프로 2세대',
      description: '거의 새것에 가까운 에어팟 프로 2세대입니다.',
      price: 180000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'electronics',
      isEscrow: false,
      hashtags: ['애플', '에어팟', '이어폰'],
      imageUrls: [],
      wishCount: 34,
      viewCount: 198,
      isWished: true,
      sellerId: 6,
      sellerNickname: '이지은',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-15T16:20:00Z'
    },
    {
      id: 7,
      title: '레고 테크닉 42154',
      description: '개봉 후 한 번 조립한 레고 테크닉입니다. 부품 완전.',
      price: 65000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'hobby',
      isEscrow: false,
      hashtags: ['레고', '테크닉', '장난감'],
      imageUrls: [],
      wishCount: 18,
      viewCount: 134,
      isWished: false,
      sellerId: 7,
      sellerNickname: '최민재',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-14T11:00:00Z'
    },
    {
      id: 8,
      title: '캠핑 텐트 4인용 대여',
      description: '코베아 4인용 텐트 대여합니다. 풀세트 구성.',
      price: 0,
      rentPrice: 15000,
      itemType: 'RENT',
      status: 'ACTIVE',
      category: 'sports',
      isEscrow: false,
      hashtags: ['캠핑', '텐트', '대여'],
      imageUrls: [],
      wishCount: 52,
      viewCount: 310,
      isWished: false,
      sellerId: 8,
      sellerNickname: '박서준',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-13T09:30:00Z'
    },
    {
      id: 9,
      title: '책 30권 나눔합니다',
      description: '자기계발·소설 혼합 30권, 읽고 나눔합니다.',
      price: 0,
      rentPrice: 0,
      itemType: 'SHARE',
      status: 'ACTIVE',
      category: 'books',
      isEscrow: false,
      hashtags: ['책', '나눔', '독서'],
      imageUrls: [],
      wishCount: 41,
      viewCount: 278,
      isWished: true,
      sellerId: 9,
      sellerNickname: '김서연',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-12T14:00:00Z'
    },
    {
      id: 10,
      title: '맥북 프로 M3 14인치',
      description: '맥북 프로 M3 14인치 512GB 스페이스 그레이 팝니다.',
      price: 2200000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'electronics',
      isEscrow: true,
      hashtags: ['맥북', '애플', '노트북'],
      imageUrls: [],
      wishCount: 103,
      viewCount: 621,
      isWished: false,
      sellerId: 10,
      sellerNickname: '이준혁',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-11T16:45:00Z'
    },
    {
      id: 11,
      title: '다이슨 에어랩 완전품',
      description: '다이슨 에어랩 컴플리트 풀세트. 정품 박스 포함.',
      price: 350000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'beauty',
      isEscrow: false,
      hashtags: ['다이슨', '에어랩', '헤어'],
      imageUrls: [],
      wishCount: 77,
      viewCount: 445,
      isWished: true,
      sellerId: 11,
      sellerNickname: '한지민',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-10T10:15:00Z'
    },
    {
      id: 12,
      title: '닌텐도 스위치 OLED',
      description: '닌텐도 스위치 OLED 화이트 + 게임 타이틀 5개 포함.',
      price: 280000,
      rentPrice: 0,
      itemType: 'SELL',
      status: 'ACTIVE',
      category: 'electronics',
      isEscrow: false,
      hashtags: ['닌텐도', '스위치', '게임'],
      imageUrls: [],
      wishCount: 59,
      viewCount: 387,
      isWished: false,
      sellerId: 12,
      sellerNickname: '오태양',
      sellerProfileImageUrl: null,
      createdAt: '2024-04-09T13:20:00Z'
    },
  ]

  const allItems   = itemsData?.data?.content || sampleItems
  const displayItems = allItems.slice(0, displayCount)
  const hasMore    = displayCount < allItems.length

  return (
    <div className="space-y-8">
      {/* 배너 슬라이더 */}
      <section>
        <BannerSlider banners={sampleBanners} />
      </section>

      {/* 상품 그리드 */}
      <section>
        {/* HOT ITEM 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
              HOT ITEM
            </span>
            {/* 반짝이 별들 */}
            <span className="absolute -top-2 -left-2 text-yellow-400 text-sm animate-bounce" style={{ animationDelay: '0ms' }}>✦</span>
            <span className="absolute -top-1 -right-3 text-pink-400 text-xs animate-bounce" style={{ animationDelay: '200ms' }}>✦</span>
            <span className="absolute -bottom-2 left-1/2 text-orange-400 text-xs animate-bounce" style={{ animationDelay: '400ms' }}>✦</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-300 via-pink-300 to-transparent" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
        
        {/* 더보기 버튼: 표시 가능한 아이템이 더 있을 때만 렌더링 */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              더보기
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
