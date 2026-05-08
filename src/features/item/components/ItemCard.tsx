// 물품 카드 컴포넌트 — ItemSummaryResponse 기반 (PR #66 정합)
import { Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
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

          {/* 거래 유형 태그 */}
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
                tradeTypeColor[item.tradeType],
              )}
            >
              {item.tradeType}
            </span>
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

        {/* 정보 */}
        <div className="p-3">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>

          <p
            className={cn(
              'font-semibold text-sm mb-2',
              item.price === 0 ? 'text-green-600' : 'text-gray-900',
            )}
          >
            {item.price === 0 ? '무료' : `${item.price.toLocaleString()}원`}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin size={12} />
              <span className="truncate">{item.region ?? '지역 미설정'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span>관심 {item.wishlistCount}</span>
              <span>•</span>
              <span>{fromNow(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
