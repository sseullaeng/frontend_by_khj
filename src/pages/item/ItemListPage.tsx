import { useState } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { useItemList } from '@/features/item/hooks'
import ItemCard from '@/features/item/components/ItemCard'
import type { ItemType } from '@/features/item/types'

const CATEGORIES = [
  { value: '',             label: '전체' },
  { value: 'electronics', label: '전자기기' },
  { value: 'clothing',    label: '의류' },
  { value: 'household',   label: '생활용품' },
  { value: 'books',       label: '도서' },
  { value: 'sports',      label: '스포츠/레저' },
  { value: 'furniture',   label: '가구/인테리어' },
  { value: 'other',       label: '기타' },
]

const TYPE_TABS: { value: ItemType | ''; label: string }[] = [
  { value: '',      label: '전체' },
  { value: 'SELL',  label: '중고거래' },
  { value: 'RENT',  label: '대여' },
  { value: 'SHARE', label: '나눔' },
]

export default function ItemListPage() {
  const [keyword, setKeyword]       = useState('')
  const [category, setCategory]     = useState('')
  const [itemType, setItemType]     = useState<ItemType | ''>('')
  const [sortBy, setSortBy]         = useState('recent')
  const debouncedKeyword            = useDebounce(keyword, 400)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useItemList({
      keyword:  debouncedKeyword || undefined,
      category: category || undefined,
      itemType: (itemType as ItemType) || undefined,
    })

  const sentinelRef = useInfiniteScroll({
    onIntersect: () => { if (hasNextPage) fetchNextPage() },
    enabled: hasNextPage,
  })

  const allItems = data?.pages.flatMap((p) => p.content) ?? []

  const sortedItems = [...allItems].sort((a, b) => {
    if (sortBy === 'price-low')  return (a.price ?? 0) - (b.price ?? 0)
    if (sortBy === 'price-high') return (b.price ?? 0) - (a.price ?? 0)
    if (sortBy === 'popular')    return (b.wishCount + b.viewCount) - (a.wishCount + a.viewCount)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="flex flex-col gap-0">

      {/* 검색 + 카테고리 필터 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 -mx-4">
        {/* 검색바 */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 focus-within:border-primary-500 focus-within:bg-white transition-colors">
          <span className="text-gray-400 text-base">🔍</span>
          <input
            type="text"
            placeholder="어떤 물품을 찾으시나요?"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* 카테고리 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary-400 hover:text-primary-500'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 거래유형 탭 + 정렬 */}
      <div className="flex items-center justify-between py-3">
        {/* 거래유형 탭 */}
        <div className="flex gap-1.5">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setItemType(tab.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                itemType === tab.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 정렬 + 총 개수 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            총 <strong className="text-gray-700">{sortedItems.length}</strong>개
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none cursor-pointer"
          >
            <option value="recent">최신순</option>
            <option value="price-low">가격 낮은순</option>
            <option value="price-high">가격 높은순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      {isLoading ? (
        <p className="text-center text-gray-400 py-12 text-sm">검색 중...</p>
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-700 font-semibold mb-1">검색 결과가 없어요</p>
          <p className="text-gray-400 text-sm mb-4">검색어나 필터를 변경해 보세요.</p>
          <button
            onClick={() => { setKeyword(''); setCategory(''); setItemType('') }}
            className="px-5 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sortedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* 무한 스크롤 감지 */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-sm text-gray-400 py-3">불러오는 중...</p>
      )}
    </div>
  )
}
