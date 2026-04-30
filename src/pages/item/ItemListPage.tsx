import { useState } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { useItemList } from '@/features/item/hooks'
import ItemCard from '@/features/item/components/ItemCard'
import ItemListItem from '@/features/item/components/ItemListItem'

import { Grid, List } from 'lucide-react'

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

const TRANSACTION_TYPES = [
  { value: '',      label: '전체' },
  { value: 'sell',  label: '중고거래' },
  { value: 'rent',  label: '대여' },
  { value: 'share', label: '나눔' },
]

const TRANSACTION_METHODS = [
  { value: '',      label: '전체' },
  { value: 'direct', label: '직접거래' },
  { value: 'escrow', label: '거래대행' },
]


const BRANDS = [
  { value: '', label: '전체' },
  { value: 'apple', label: 'Apple' },
  { value: 'samsung', label: 'Samsung' },
  { value: 'lg', label: 'LG' },
  { value: 'sony', label: 'Sony' },
  { value: 'nike', label: 'Nike' },
  { value: 'adidas', label: 'Adidas' },
  { value: 'hyundai', label: 'Hyundai' },
  { value: 'kia', label: 'Kia' },
  { value: 'toyota', label: 'Toyota' },
]

export default function ItemListPage() {
  const [keyword, setKeyword]       = useState('')
  const [category, setCategory]     = useState('')
  const [transactionType, setTransactionType] = useState('')
  const [transactionMethod, setTransactionMethod] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [brand, setBrand]           = useState('')
  const [sortBy, setSortBy]         = useState('recent')
  const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid')
  const debouncedKeyword            = useDebounce(keyword, 400)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useItemList({
      keyword:  debouncedKeyword || undefined,
      category: category || undefined,
    })

  const sentinelRef = useInfiniteScroll({
    onIntersect: () => { if (hasNextPage) fetchNextPage() },
    enabled: hasNextPage,
  })

  const allItems = data?.pages.flatMap((p) => p.content) ?? []

  // 필터링 로직
  const filteredItems = allItems.filter((item) => {
    // 거래 유형 필터링
    if (transactionType) {
      if (transactionType === 'share') {
        // 나눔: 중고와 대여 가격이 모두 0원인 경우
        if (!(item.price === 0 && item.rentPrice === 0)) return false
      } else if (transactionType === 'sell') {
        // 중고거래: 중고 가격이 0원이 아닌 경우
        if (item.price === 0) return false
      } else if (transactionType === 'rent') {
        // 대여: 대여 가격이 0원이 아닌 경우
        if (item.rentPrice === 0) return false
      }
    }

    // 거래 방식 필터링
    if (transactionMethod) {
      if (transactionMethod === 'escrow' && !item.isEscrow) return false
      if (transactionMethod === 'direct' && item.isEscrow) return false
    }

    // 가격 범위 필터링
    if (minPrice || maxPrice) {
      const price = item.price || 0
      if (minPrice && price < parseInt(minPrice)) return false
      if (maxPrice && price > parseInt(maxPrice)) return false
    }

    // 브랜드 필터링
    if (brand && item.brand !== brand) return false

    return true
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
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

      {/* 필터링 옵션 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 -mx-4">
        {/* 거래 유형 */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">거래 유형</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TRANSACTION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setTransactionType(type.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                  transactionType === type.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-400 hover:text-primary-500'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 거래 방식 */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">거래 방식</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TRANSACTION_METHODS.map((method) => (
              <button
                key={method.value}
                onClick={() => setTransactionMethod(method.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                  transactionMethod === method.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-400 hover:text-primary-500'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* 가격 범위 */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">가격 범위</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="최소 가격"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex items-center px-2 text-gray-400">~</div>
            <div className="flex-1">
              <input
                type="number"
                placeholder="최대 가격"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 브랜드 */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">브랜드</p>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none cursor-pointer"
          >
            {BRANDS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 정렬 + 총 개수 + 보기 형식 */}
      <div className="flex items-center justify-between px-4 py-3 -mx-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            총 <strong className="text-gray-700">{sortedItems.length}</strong>개
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 보기 형식 토글 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
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
            >
              <List size={16} />
            </button>
          </div>
          
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
            onClick={() => { 
              setKeyword(''); 
              setCategory(''); 
              setTransactionType('');
              setTransactionMethod('');
              setMinPrice('');
              setMaxPrice('');
              setBrand('');
            }}
            className="px-5 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <ItemListItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 무한 스크롤 감지 */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-sm text-gray-400 py-3">불러오는 중...</p>
      )}
    </div>
  )
}
