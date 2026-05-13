// 메인 홈페이지 — 배너 + HOT/대여/판매 섹션 (각 5×2 그리드 + 좌우 드래그 오버플로)
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import BannerSlider from '@/shared/ui/BannerSlider'
import ItemCard from '@/features/item/components/ItemCard'
import { itemApi } from '@/features/item/api'
import { itemKeys } from '@/features/item/keys'
import { sortCompletedLast, sortHotMultiKey } from '@/features/item/sort'
import type { Item } from '@/features/item/types'
import { bannerApi } from '@/features/banner/api'
import { bannerKeys } from '@/features/banner/keys'

const FETCH_SIZE = 24
const GRID_COUNT = 10  // 한 줄 5개 × 2줄

export default function HomePage() {
  // 배너 — 백엔드가 활성/윈도우 필터링 + sortOrder 정렬해서 반환 (§10.8)
  const { data: bannerList } = useQuery({
    queryKey: bannerKeys.active(),
    queryFn: () => bannerApi.getActive().then((r) => r.data),
    staleTime: 5 * 60_000,
  })
  const banners = (bannerList ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl ?? undefined,
  }))

  // ⚠ queryKey 는 itemKeys.lists() prefix 아래에 둬야 useToggleWish 의
  //   optimistic update (setQueriesData on itemKeys.lists()) 가 잡아서 갱신함

  // HOT — 관심 수 → 조회 수 → 최근 등록 (백엔드 wishlist_desc + 클라이언트 다중키 보정)
  const hotQuery = useQuery({
    queryKey: [...itemKeys.lists(), 'home-hot'],
    queryFn: () =>
      itemApi.getList({ page: 0, size: FETCH_SIZE, sort: 'wishlist_desc' }).then((r) => r.data),
  })

  // 대여 — 최근 등록 순
  const rentalQuery = useQuery({
    queryKey: [...itemKeys.lists(), 'home-rental'],
    queryFn: () =>
      itemApi
        .getList({ page: 0, size: FETCH_SIZE, sort: 'latest', tradeType: '대여' })
        .then((r) => r.data),
  })

  // 판매 — 최근 등록 순
  const saleQuery = useQuery({
    queryKey: [...itemKeys.lists(), 'home-sale'],
    queryFn: () =>
      itemApi
        .getList({ page: 0, size: FETCH_SIZE, sort: 'latest', tradeType: '판매' })
        .then((r) => r.data),
  })

  // 거래완료는 항상 후순위로 (모든 섹션 공통)
  const hotItems = sortCompletedLast(sortHotMultiKey(hotQuery.data?.content ?? []))
  const rentalItems = sortCompletedLast(rentalQuery.data?.content ?? [])
  const saleItems = sortCompletedLast(saleQuery.data?.content ?? [])

  return (
    <div className="space-y-10">
      {banners.length > 0 && (
        <section>
          <BannerSlider banners={banners} />
        </section>
      )}

      <HotSection items={hotItems} isLoading={hotQuery.isLoading} />
      <TradeSection title="대여 아이템" tone="blue"   items={rentalItems} isLoading={rentalQuery.isLoading} />
      <TradeSection title="판매 아이템" tone="orange" items={saleItems}   isLoading={saleQuery.isLoading} />
    </div>
  )
}

function HotSection({ items, isLoading }: { items: Item[]; isLoading: boolean }) {
  return (
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
      <ItemSectionBody items={items} isLoading={isLoading} emptyMessage="등록된 물품이 없어요." />
    </section>
  )
}

const TONE_STYLES: Record<'blue' | 'orange', { text: string; bar: string }> = {
  blue:   { text: 'text-blue-600',   bar: 'from-blue-300 to-transparent' },
  orange: { text: 'text-orange-600', bar: 'from-orange-300 to-transparent' },
}

function TradeSection({
  title, tone, items, isLoading,
}: { title: string; tone: 'blue' | 'orange'; items: Item[]; isLoading: boolean }) {
  const s = TONE_STYLES[tone]
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className={`text-xl font-extrabold tracking-tight ${s.text}`}>{title}</span>
        <div className={`flex-1 h-px bg-gradient-to-r ${s.bar}`} />
      </div>
      <ItemSectionBody items={items} isLoading={isLoading} emptyMessage={`${title}이 없어요.`} />
    </section>
  )
}

function ItemSectionBody({
  items, isLoading, emptyMessage,
}: { items: Item[]; isLoading: boolean; emptyMessage: string }) {
  if (isLoading) return <p className="text-center text-sm text-gray-400 py-10">불러오는 중...</p>
  if (items.length === 0) return <p className="text-center text-sm text-gray-400 py-10">{emptyMessage}</p>

  const gridItems = items.slice(0, GRID_COUNT)
  const overflowItems = items.slice(GRID_COUNT)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {gridItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      {overflowItems.length > 0 && (
        <DragScrollRow>
          {overflowItems.map((item) => (
            <ItemCard key={item.id} item={item} className="w-40 sm:w-44 md:w-48 shrink-0" />
          ))}
        </DragScrollRow>
      )}
    </>
  )
}

/** 좌우 드래그 가로 스크롤 — 터치는 native, 데스크탑은 pointer drag */
function DragScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const movedRef = useRef(false)
  const draggingRef = useRef(false)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return
    // 터치는 native scroll 그대로 (관성/스냅 유지). 마우스만 잡아서 drag scroll.
    if (e.pointerType === 'touch') return
    draggingRef.current = true
    movedRef.current = false
    startXRef.current = e.clientX
    scrollLeftRef.current = ref.current.scrollLeft
    ref.current.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !ref.current) return
    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > 4) movedRef.current = true
    ref.current.scrollLeft = scrollLeftRef.current - dx
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    if (ref.current?.hasPointerCapture(e.pointerId)) {
      ref.current.releasePointerCapture(e.pointerId)
    }
  }

  // drag 중에 카드(Link) 클릭이 발생하지 않도록 capture 단계에서 차단
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      movedRef.current = false
    }
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      className="mt-6 flex gap-4 overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing [scrollbar-width:thin]"
    >
      {children}
    </div>
  )
}
