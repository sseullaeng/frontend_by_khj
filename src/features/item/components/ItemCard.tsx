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

// 상태 배지 (판매중은 미표시) — '예약' 은 사용자 노출명 '거래중'
const statusBadge: Partial<Record<ItemStatus, { label: string; color: string }>> = {
  '예약':     { label: '거래중',  color: 'bg-yellow-100 text-yellow-800' },
  '거래완료': { label: '거래완료', color: 'bg-gray-700 text-white' },
  '비공개':   { label: '비공개',  color: 'bg-red-100 text-red-800' },
}

export default function ItemCard({ item, className }: ItemCardProps) {
  const { mutate: toggleWish } = useToggleWish(item.id)
  const status = statusBadge[item.status]
  const isCompleted = item.status === '거래완료'

  // 라운드13 — tradeTypes 우선, legacy 단일 모드면 [tradeType] 으로 폴백
  const modes: TradeType[] = item.tradeTypes?.length ? item.tradeTypes : [item.tradeType]

  return (
    <Link to={`/items/${item.id}`} className={cn('block group', className)}>
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* 썸네일 */}
        <div className="relative aspect-square bg-gray-100">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className={cn(
                'w-full h-full object-cover transition-transform duration-200',
                isCompleted ? 'grayscale' : 'group-hover:scale-105',
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
            </div>
          )}

          {/* 거래 유형 태그 — 다중 등록이면 여러 개 */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {item.rentalActive && (
              <span className="px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-emerald-600 text-white shadow-sm">
                대여중
              </span>
            )}
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

          {/* 상태 배지 (판매중·거래완료 외) — 거래완료는 카드 전체 오버레이에서 처리 */}
          {status && !isCompleted && (
            <div className="absolute bottom-2 left-2">
              <span className={cn('px-2 py-1 rounded-lg text-xs font-medium', status.color)}>
                {status.label}
              </span>
            </div>
          )}
        </div>

        {/* 거래완료 — 카드 전체 회색 + 중앙 텍스트 */}
        {isCompleted && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-gray-300/55">
            <span className="relative px-3 py-1 rounded-lg bg-gray-900/85 text-white text-sm font-bold tracking-wide">
              거래완료
            </span>
          </div>
        )}

        {/* 정보 — 영역별 고정 높이로 카드 전체 크기 통일.
            자식 합 = 제목(40) + 해시태그(16) + 가격(40) + 메타(16) + gap(12) + padding(24) = ~148px
            여유 두고 h-[10rem](160px) */}
        <div className="p-3 h-[10rem] flex flex-col">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-5 mb-1 h-[2.5rem] group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>

          {/* 해시태그 — 한 줄 고정 (없으면 빈 자리로 layout 유지) */}
          <p className="text-[11px] text-primary-600 truncate mb-1 h-[1rem] leading-4">
            {item.hashtags && item.hashtags.length > 0
              ? item.hashtags.slice(0, 5).map((t) => `#${t}`).join(' ')
              : ' '}
          </p>

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
