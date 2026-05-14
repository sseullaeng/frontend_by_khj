// 메인 홈페이지 — 배너 + HOT/대여/판매 섹션 (각 10개 단위 페이지 가로 캐러셀)
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BannerSlider from '@/shared/ui/BannerSlider'
import ItemCard from '@/features/item/components/ItemCard'
import { itemApi } from '@/features/item/api'
import { itemKeys } from '@/features/item/keys'
import type { Item } from '@/features/item/types'
import { bannerApi } from '@/features/banner/api'
import { bannerKeys } from '@/features/banner/keys'
import { cn } from '@/shared/lib/cn'

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
  //
  // 정렬은 라운드14 백엔드 CSV multi-key sort 위임. 마지막에 id desc 자동 tiebreak.

  // HOT — 거래완료 후순위 + 관심 수 → 조회 수 → 최근 등록
  const hotQuery = useQuery({
    queryKey: [...itemKeys.lists(), 'home-hot'],
    queryFn: () =>
      itemApi
        .getList({ page: 0, size: FETCH_SIZE, sort: 'completed_last,wishlist_desc,view_desc,latest' })
        .then((r) => r.data),
  })

  // 대여 — 거래완료 후순위 + 최근 등록 순
  const rentalQuery = useQuery({
    queryKey: [...itemKeys.lists(), 'home-rental'],
    queryFn: () =>
      itemApi
        .getList({ page: 0, size: FETCH_SIZE, sort: 'completed_last,latest', tradeType: '대여' })
        .then((r) => r.data),
  })

  // 판매 — 거래완료 후순위 + 최근 등록 순
  const saleQuery = useQuery({
    queryKey: [...itemKeys.lists(), 'home-sale'],
    queryFn: () =>
      itemApi
        .getList({ page: 0, size: FETCH_SIZE, sort: 'completed_last,latest', tradeType: '판매' })
        .then((r) => r.data),
  })

  const hotItems    = hotQuery.data?.content    ?? []
  const rentalItems = rentalQuery.data?.content ?? []
  const saleItems   = saleQuery.data?.content   ?? []

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

const TONE_STYLES: Record<'blue' | 'orange', {
  gradient: string
  bar: string
  star1: string
  star2: string
  star3: string
}> = {
  // 대여 — 시원한 블루/시안/스카이 톤
  blue: {
    gradient: 'from-sky-500 via-cyan-500 to-blue-500',
    bar:      'from-sky-300 via-cyan-300 to-transparent',
    star1:    'text-cyan-400',
    star2:    'text-sky-400',
    star3:    'text-blue-400',
  },
  // 판매 — 따뜻한 오렌지/앰버/옐로 톤
  orange: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    bar:      'from-orange-300 via-amber-300 to-transparent',
    star1:    'text-amber-400',
    star2:    'text-orange-400',
    star3:    'text-yellow-400',
  },
}

function TradeSection({
  title, tone, items, isLoading,
}: { title: string; tone: 'blue' | 'orange'; items: Item[]; isLoading: boolean }) {
  const s = TONE_STYLES[tone]
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex items-center gap-2">
          <span className={`text-xl font-extrabold tracking-tight bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent animate-pulse`}>
            {title}
          </span>
          <span className={`absolute -top-2 -left-2 text-sm animate-bounce ${s.star1}`} style={{ animationDelay: '0ms' }}>✦</span>
          <span className={`absolute -top-1 -right-3 text-xs animate-bounce ${s.star2}`} style={{ animationDelay: '200ms' }}>✦</span>
          <span className={`absolute -bottom-2 left-1/2 text-xs animate-bounce ${s.star3}`} style={{ animationDelay: '400ms' }}>✦</span>
        </div>
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

  // 10개 단위로 페이지화. 한 페이지가 그 자체로 그리드 (2~5 cols, 2줄).
  const pages: Item[][] = []
  for (let i = 0; i < items.length; i += GRID_COUNT) {
    pages.push(items.slice(i, i + GRID_COUNT))
  }

  if (pages.length === 1) {
    // 페이지 1개 — 슬라이드 / 도트 / 화살표 모두 불필요
    return <PageGrid items={pages[0]} />
  }

  return <PagedCarousel pages={pages} />
}

function PageGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

/**
 * 페이지 단위 가로 슬라이드 캐러셀.
 *   - 각 페이지가 viewport 폭을 가득 차지 (w-full shrink-0 snap-start)
 *   - snap-x snap-mandatory 로 한 페이지 단위로 정착
 *   - 데스크탑: 좌우 화살표 + 마우스 드래그
 *   - 모바일: 화살표 숨김, 터치 native 스크롤 + snap
 *   - 하단 도트 인디케이터 (현재 페이지 강조, 클릭 시 해당 페이지로 이동)
 */
function PagedCarousel({ pages }: { pages: Item[][] }) {
  const ref = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const movedRef = useRef(false)
  const draggingRef = useRef(false)

  const [active, setActive] = useState(0)

  const updateActive = () => {
    const el = ref.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    setActive(Math.min(pages.length - 1, Math.max(0, idx)))
  }

  useEffect(() => {
    updateActive()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      // viewport 변경 시 현재 페이지가 어색하게 걸치지 않도록 강제 재정렬
      el.scrollTo({ left: active * el.clientWidth, behavior: 'instant' as ScrollBehavior })
    })
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTo = (idx: number) => {
    const el = ref.current
    if (!el) return
    const clamped = Math.min(pages.length - 1, Math.max(0, idx))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return
    if (e.pointerType === 'touch') return  // 터치는 native (관성/snap 유지)
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
    if (!draggingRef.current || !ref.current) return
    draggingRef.current = false
    if (ref.current.hasPointerCapture(e.pointerId)) {
      ref.current.releasePointerCapture(e.pointerId)
    }
    // 드래그 종료 시 가장 가까운 페이지로 snap
    const idx = Math.round(ref.current.scrollLeft / Math.max(1, ref.current.clientWidth))
    goTo(idx)
  }
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      movedRef.current = false
    }
  }

  const atStart = active === 0
  const atEnd   = active === pages.length - 1

  return (
    <div className="relative group">
      {/* 좌측 화살표 — 모바일 hide */}
      {!atStart && (
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label="이전 페이지"
          className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 border border-gray-200 shadow-md text-gray-700 items-center justify-center hover:bg-white hover:shadow-lg transition-all"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {!atEnd && (
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="다음 페이지"
          className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 border border-gray-200 shadow-md text-gray-700 items-center justify-center hover:bg-white hover:shadow-lg transition-all"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onScroll={updateActive}
        className="flex overflow-x-auto select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((page, idx) => (
          <div key={idx} className="w-full shrink-0 snap-start">
            <PageGrid items={page} />
          </div>
        ))}
      </div>

      {/* 도트 인디케이터 */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {pages.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`${idx + 1}페이지로 이동`}
            className={cn(
              'rounded-full transition-all',
              idx === active
                ? 'w-5 h-2 bg-primary-500'
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400',
            )}
          />
        ))}
      </div>
    </div>
  )
}
