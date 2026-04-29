import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Item } from '../types'
import { cn } from '@/shared/lib/cn'
import { useToggleWish } from '../hooks'

interface ItemCardProps {
  item: Item
  className?: string
}

const typeLabels = {
  SELL: '중고거래',
  RENT: '대여',
  SHARE: '나눔',
} as const

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-gray-100 text-gray-800',
  HIDDEN: 'bg-red-100 text-red-800',
} as const

export default function ItemCard({ item, className }: ItemCardProps) {
  const [wished, setWished] = useState(item.isWished)
  const { mutate: toggleWish } = useToggleWish(item.id)
  const isFree = item.price === 0
  
  return (
    <Link to={`/items/${item.id}`} className={cn('block group', className)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* 이미지 */}
        <div className="relative aspect-square bg-gray-100">
          {item.imageUrls.length > 0 ? (
            <img
              src={item.imageUrls[0]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
            </div>
          )}
          
          {/* 상품 타입 뱃지 */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium">
              {typeLabels[item.itemType]}
            </span>
          </div>

          {/* 찜하기 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setWished((prev) => !prev)
              toggleWish()
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
          >
            <Heart
              size={16}
              className={cn(wished ? 'fill-red-500 text-red-500' : 'text-gray-600')}
            />
          </button>

          {/* 상태 뱃지 */}
          {item.status !== 'ACTIVE' && (
            <div className="absolute bottom-2 left-2">
              <span className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium',
                statusColors[item.status]
              )}>
                {item.status === 'RESERVED' && '예약중'}
                {item.status === 'SOLD' && '판매완료'}
                {item.status === 'HIDDEN' && '숨김'}
              </span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-3">
          {/* 제목 */}
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>

          {/* 가격 - 대여가격과 중고가격 모두 표시 */}
          <div className="space-y-1 mb-2">
            {/* 중고가격 */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500">중고:</span>
              <span className={cn(
                'font-semibold text-sm',
                item.price === 0 ? 'text-green-600' : 'text-gray-900'
              )}>
                {item.price === 0 ? '무료' : `${item.price.toLocaleString()}원`}
              </span>
            </div>
            
            {/* 대여가격 (일일 기준) */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500">대여:</span>
              <span className="font-semibold text-sm text-blue-600">
                {item.price === 0 ? '무료' : `${Math.floor(item.price * 0.05).toLocaleString()}원`}
              </span>
              <span className="text-xs text-gray-500">/일</span>
            </div>
          </div>

          {/* 해시태그 */}
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.hashtags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
              {item.hashtags.length > 3 && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  +{item.hashtags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 하단 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span className="truncate">서울</span>
            </div>
            <div className="flex items-center gap-2">
              <span>관심 {item.wishCount}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(item.createdAt), { 
                addSuffix: true, 
                locale: ko 
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
