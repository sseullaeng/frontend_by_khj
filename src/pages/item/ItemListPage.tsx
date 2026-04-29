import { useState } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { useItemList } from '@/features/item/hooks'
import { Input } from '@/shared/ui/Input'

export default function ItemListPage() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 400)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useItemList({ keyword: debouncedKeyword })

  const sentinelRef = useInfiniteScroll({
    onIntersect: () => { if (hasNextPage) fetchNextPage() },
    enabled: hasNextPage,
  })

  const items = data?.pages.flatMap((p) => p.content) ?? []

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="검색어를 입력해 주세요"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {isLoading ? (
        <p className="text-center text-gray-400 py-8">검색 중...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-400 py-8">검색 결과가 없어요</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="h-48 bg-gray-100 rounded-xl p-2 text-sm">
              {/* TODO: ItemCard 컴포넌트 */}
              {item.title}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <p className="text-center text-sm text-gray-400 py-2">불러오는 중...</p>
      )}
    </div>
  )
}
