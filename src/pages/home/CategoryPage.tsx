import { useParams } from 'react-router-dom'
import { useItemList } from '@/features/item/hooks'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useItemList({ category: slug })

  const sentinelRef = useInfiniteScroll({
    onIntersect: () => { if (hasNextPage) fetchNextPage() },
    enabled: hasNextPage,
  })

  const items = data?.pages.flatMap((p) => p.content) ?? []

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">{slug}</h1>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="h-48 bg-gray-100 rounded-xl">
            {/* TODO: ItemCard 컴포넌트 */}
            {item.title}
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <p className="text-center text-sm text-gray-400 py-2">불러오는 중...</p>}
    </div>
  )
}
