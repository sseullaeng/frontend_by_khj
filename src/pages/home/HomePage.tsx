// 메인 홈페이지 — 배너 슬라이더 + HOT ITEM 그리드 (찜 많은 순)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BannerSlider from '@/shared/ui/BannerSlider'
import ItemCard from '@/features/item/components/ItemCard'
import { itemApi } from '@/features/item/api'

const PAGE_SIZE = 6
const FETCH_SIZE = 24  // 한 번에 받아둘 추천 풀

const sampleBanners = [
  {
    id: 1,
    title: '🎉 쓸랭 오픈 기념 이벤트',
    description: '첫 거래 시 포인트 1000원 지급!',
    imageUrl: '/banner1.png',
    linkUrl: '/notices/1',
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

export default function HomePage() {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'home-hot'],
    queryFn: () =>
      itemApi.getList({ page: 0, size: FETCH_SIZE, sort: 'wishlist_desc' }).then((r) => r.data),
  })

  const allItems = data?.content ?? []
  const displayItems = allItems.slice(0, displayCount)
  const hasMore = displayCount < allItems.length

  return (
    <div className="space-y-8">
      <section>
        <BannerSlider banners={sampleBanners} />
      </section>

      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
              HOT ITEM
            </span>
            <span className="absolute -top-2 -left-2 text-yellow-400 text-sm animate-bounce" style={{ animationDelay: '0ms' }}>✦</span>
            <span className="absolute -top-1 -right-3 text-pink-400 text-xs animate-bounce" style={{ animationDelay: '200ms' }}>✦</span>
            <span className="absolute -bottom-2 left-1/2 text-orange-400 text-xs animate-bounce" style={{ animationDelay: '400ms' }}>✦</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-300 via-pink-300 to-transparent" />
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-gray-400 py-12">불러오는 중...</p>
        ) : allItems.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">등록된 물품이 없어요.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

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
          </>
        )}
      </section>
    </div>
  )
}
