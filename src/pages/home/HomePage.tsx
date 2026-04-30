import BannerSlider from '@/shared/ui/BannerSlider'
import ItemCard from '@/features/item/components/ItemCard'
import { itemApi } from '@/features/item/api'
import { useQuery } from '@tanstack/react-query'
import type { Item } from '@/features/item/types'

// 샘플 배너 데이터
const sampleBanners = [
  {
    id: 1,
    title: '🎉 쓸랭 오픈 기념 이벤트',
    description: '첫 거래 시 포인트 1000원 지급!',
    backgroundColor: '#6366f1'
  },
  {
    id: 2,
    title: '🌱 지구살리기 나눔 챌린지',
    description: '안 쓰는 물건 나누고 포인트 받자',
    backgroundColor: '#10b981'
  },
  {
    id: 3,
    title: '📦 배달대행 서비스 오픈',
    description: '동네 배달대행 최대 30% 할인',
    backgroundColor: '#f59e0b'
  }
]

/**
 * 메인 홈 페이지
 * - 배너 슬라이더 (공지/이벤트)
 * - 카테고리 그리드
 * - 추천 상품 그리드
 */
export default function HomePage() {
  // 추천 상품 데이터 조회 (실제 API 연동 시 활성화)
  const { data: itemsData } = useQuery({
    queryKey: ['items', { page: 1, size: 6 }],
    queryFn: () => itemApi.getList({ page: 1, size: 6 }),
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
    }
  ]

  const displayItems = itemsData?.data?.content || sampleItems

  return (
    <div className="space-y-8">
      {/* 배너 슬라이더 */}
      <section>
        <BannerSlider banners={sampleBanners} />
      </section>

      {/* 상품 그리드 */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
        
        {/* 더보기 버튼 */}
        <div className="flex justify-center mt-8">
          <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
            더보기
          </button>
        </div>
      </section>
    </div>
  )
}
