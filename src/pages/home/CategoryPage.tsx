// 카테고리 페이지 — /categories/:id, 백엔드 categoryId 기준
//
// 라우트가 numeric id 를 받아 직접 useItemList({ categoryId }) 호출.
// 카테고리명은 useCategoryLookup 의 getLabel 로 "1차 > 2차" 형태 표시.
import { useParams } from 'react-router-dom'
import { useItemList } from '@/features/item/hooks'
import { useCategoryLookup } from '@/features/category/hooks'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import ItemCard from '@/features/item/components/ItemCard'

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const categoryId = id ? Number(id) : NaN
  const valid = Number.isFinite(categoryId) && categoryId > 0

  const { getLabel } = useCategoryLookup()
  const label = valid ? getLabel(categoryId) : ''

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useItemList({ categoryId: valid ? categoryId : undefined })

  const sentinelRef = useInfiniteScroll({
    onIntersect: () => { if (hasNextPage) fetchNextPage() },
    enabled: hasNextPage,
  })

  const items = data?.pages.flatMap((p) => p.content) ?? []

  if (!valid) {
    return <p className="py-12 text-center text-sm text-gray-400">잘못된 카테고리 주소예요.</p>
  }

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">
        {label || `카테고리 #${categoryId}`}
      </h1>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">등록된 물품이 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && <p className="text-center text-sm text-gray-400 py-2">불러오는 중...</p>}
    </div>
  )
}
