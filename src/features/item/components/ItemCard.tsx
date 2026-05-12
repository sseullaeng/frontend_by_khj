// 물품 카드 컴포넌트 — ItemSummaryResponse 기반
//
// 라운드13 — 카드 크기 고정 + 판매/대여 다중 가격 표시
//   · 카드 전체 높이 고정 (썸네일 aspect-square + 정보 영역 고정 크기)
//   · tradeTypes 배열에서 판매/대여 모드별 가격 모두 표시
import { Link } from 'react-router-dom'
import { Heart, MapPin, Eye } from 'lucide-react'
import type { Item, TradeType, ItemStatus } from '../types'
import { cn } from '@/shared/lib/cn'
import { fromNow } from '@/shared/lib/date'
import { useToggleWish } from '../hooks'

interface ItemCardProps {
  item: Item
  className?: string
}

// 거래 유형 별 색상
const tradeTypeColor: Record<TradeType, string> = {
  '판매': 'bg-blue-100 text-blue-800',
  '대여': 'bg-green-100 text-green-800',
  '나눔': 'bg-purple-100 text-purple-800',
}

// 상태 배지 (판매중은 미표시)
const statusBadge: Partial<Record<ItemStatus, { label: string; color: string }>> = {
  '예약':     { label: '예약중',  color: 'bg-yellow-100 text-yellow-800' },
  '거래완료': { label: '거래완료', color: 'bg-gray-100 text-gray-800' },
  '비공개':   { label: '비공개',  color: 'bg-red-100 text-red-800' },
}

export default function ItemCard({ item, className }: ItemCardProps) {
  const { mutate: toggleWish } = useToggleWish(item.id)
  const status = statusBadge[item.status]

  // 라운드13 — tradeTypes 우선, legacy 단일 모드면 [tradeType] 으로 폴백
  const modes: TradeType[] = item.tradeTypes?.length ? item.tradeTypes : [item.tradeType]

  return (
    <Link to={`/items/${item.id}`} className={cn('block group', className)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* 썸네일 */}
        <div className="relative aspect-square bg-gray-100">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
            </div>
          )}

          {/* 거래 유형 태그 — 다중 등록이면 여러 개 */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {modes.map((m) => (
              <span
                key={m}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
                  tradeTypeColor[m],
                )}
              >
                {m}
              </span>
            ))}
          </div>

          {/* 찜 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleWish({ current: item.isWishlisted })
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
            aria-label={item.isWishlisted ? '찜 해제' : '찜 추가'}
          >
            <Heart
              size={16}
              className={cn(item.isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600')}
            />
          </button>

          {/* 상태 배지 (판매중 외) */}
          {status && (
            <div className="absolute bottom-2 left-2">
              <span className={cn('px-2 py-1 rounded-lg text-xs font-medium', status.color)}>
                {status.label}
              </span>
            </div>
          )}
        </div>

        {/* 정보 — 영역별 고정 높이로 카드 전체 크기 통일 */}
        <div className="p-3 h-[7.25rem] flex flex-col">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 h-[2.5rem] group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>

          {/* 가격 영역 — 모드별 한 줄씩, 2 줄 고정 높이 */}
          <div className="mb-1.5 h-[2.5rem] flex flex-col justify-center gap-0.5">
            {modes.includes('나눔') ? (
              <p className="font-semibold text-sm leading-tight text-emerald-600">무료 나눔</p>
            ) : (
              <>
                {modes.includes('판매') && (
                  <p className="text-sm leading-tight">
                    <span className="text-[10px] text-gray-400 mr-1">판매</span>
                    <span className="font-semibold text-gray-900">
                      {(item.salePrice ?? item.price).toLocaleString()}원
                    </span>
                  </p>
                )}
                {modes.includes('대여') && (
                  <p className="text-sm leading-tight">
                    <span className="text-[10px] text-gray-400 mr-1">대여</span>
                    <span className="font-semibold text-gray-900">
                      {(item.rentalPrice ?? item.price).toLocaleString()}원
                    </span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* 메타 정보 — 한 줄 고정 */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin size={12} />
              <span className="truncate">{item.region ?? '지역 미설정'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-0.5">
                <Eye size={11} />
                {item.viewCount.toLocaleString()}
              </span>
              <span>·</span>
              <span>{fromNow(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
