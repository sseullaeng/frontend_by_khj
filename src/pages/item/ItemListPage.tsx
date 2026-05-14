// 물품 목록 페이지 — 백엔드 §6 / PR #66 정합
//
// 백엔드 인식 query param: q, categoryId, tradeType, minPrice, maxPrice, tag, sort
// (기존 client-side brand / transactionMethod / category-slug 필터는 제거 — 백엔드 미지원)

import { useState, type KeyboardEvent } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { useItemList } from '@/features/item/hooks'
import type { ItemSort, TradeType } from '@/features/item/types'
import CategoryPicker from '@/features/category/CategoryPicker'
import ItemCard from '@/features/item/components/ItemCard'
import ItemListItem from '@/features/item/components/ItemListItem'
import { Grid, List, X } from 'lucide-react'

const TRADE_TYPES: { value: '' | TradeType; label: string }[] = [
  { value: '', label: '전체' },
  { value: '판매', label: '판매' },
  { value: '대여', label: '대여' },
  { value: '나눔', label: '나눔' },
]

const normalizePriceInput = (value: string) => value.replace(/\D/g, '')
const preventInvalidPriceKey = (e: KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
}

export default function ItemListPage() {
  const [keyword, setKeyword] = useState('')
  const [tradeType, setTradeType] = useState<'' | TradeType>('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<ItemSort>('latest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const debouncedKeyword = useDebounce(keyword, 400)

  // 거래완료는 항상 후순위로 (백엔드 multi-key sort 위임 — 페이지 경계 안정)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useItemList({
    q: debouncedKeyword || undefined,
    tradeType: tradeType || undefined,
    categoryId: categoryId ?? undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: `completed_last,${sort}`,
  })

  const sentinelRef = useInfiniteScroll({
    onIntersect: () => {
      if (hasNextPage) fetchNextPage()
    },
    enabled: hasNextPage,
  })

  const items = data?.pages.flatMap((p) => p.content) ?? []
  const totalCount = data?.pages[0]?.totalElements ?? 0

  const resetFilters = () => {
    setKeyword('')
    setTradeType('')
    setCategoryId(null)
    setMinPrice('')
    setMaxPrice('')
    setSort('latest')
  }

  return (
    <div className="flex flex-col gap-0">
      {/* 검색 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 -mx-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary-500 focus-within:bg-white transition-colors">
          <span className="text-gray-400 text-base">🔍</span>
          <input
            type="text"
            placeholder="어떤 물품을 찾으시나요?"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
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
      </div>

      {/* 필터 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 -mx-4 space-y-3">
        {/* 카테고리 */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">카테고리</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CategoryPicker value={categoryId} onChange={setCategoryId} />
            </div>
            {categoryId && (
              <button
                onClick={() => setCategoryId(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
                aria-label="카테고리 초기화"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 거래 유형 */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">거래 유형</p>
          <div className="flex flex-wrap gap-2">
            {TRADE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTradeType(t.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  tradeType === t.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-400 hover:text-primary-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 가격 범위 */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">가격 범위</p>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="최소 가격"
              value={minPrice}
              onChange={(e) => setMinPrice(normalizePriceInput(e.target.value))}
              onKeyDown={preventInvalidPriceKey}
              className="w-full min-w-0 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-500"
            />
            <div className="flex items-center justify-center px-1 text-gray-400">~</div>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="최대 가격"
              value={maxPrice}
              onChange={(e) => setMaxPrice(normalizePriceInput(e.target.value))}
              onKeyDown={preventInvalidPriceKey}
              className="w-full min-w-0 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 정렬 + 총 개수 + 보기 형식 */}
      <div className="flex flex-col gap-2 px-4 py-3 -mx-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-gray-400">
          총 <strong className="text-gray-700">{totalCount}</strong>개
        </span>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="flex shrink-0 items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="그리드 보기"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="리스트 보기"
            >
              <List size={16} />
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ItemSort)}
            className="min-w-0 flex-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none cursor-pointer sm:flex-none"
          >
            <option value="latest">최신순</option>
            <option value="price_asc">가격 낮은순</option>
            <option value="price_desc">가격 높은순</option>
            <option value="view_desc">조회순</option>
            <option value="wishlist_desc">찜 많은순</option>
          </select>
        </div>
      </div>

      {/* 결과 */}
      {isLoading ? (
        <p className="text-center text-gray-400 py-12 text-sm">검색 중...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-700 font-semibold mb-1">검색 결과가 없어요</p>
          <p className="text-gray-400 text-sm mb-4">검색어나 필터를 변경해 보세요.</p>
          <button
            onClick={resetFilters}
            className="px-5 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg"
          >
            필터 초기화
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemListItem key={item.id} item={item} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-sm text-gray-400 py-3">불러오는 중...</p>
      )}
    </div>
  )
}
