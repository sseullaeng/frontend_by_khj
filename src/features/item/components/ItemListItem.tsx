import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Item } from '../types'
import { cn } from '@/shared/lib/cn'
import { useToggleWish } from '../hooks'

interface ItemListItemProps {
  item: Item
  className?: string
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-gray-100 text-gray-800',
  HIDDEN: 'bg-red-100 text-red-800',
} as const

export default function ItemListItem({ item, className }: ItemListItemProps) {
  const [wished, setWished] = useState(item.isWished)
  const { mutate: toggleWish } = useToggleWish(item.id)
  
  // 여러 거래유형 태그 생성
  const getTransactionTags = () => {
    const tags = []
    if (item.price > 0) tags.push({ label: '중고거래', color: 'bg-blue-100 text-blue-800' })
    if (item.rentPrice > 0) tags.push({ label: '대여', color: 'bg-green-100 text-green-800' })
    if (item.price === 0 && item.rentPrice === 0) tags.push({ label: '나눔', color: 'bg-purple-100 text-purple-800' })
    return tags
  }
  
  return (
    <Link to={`/items/${item.id}`} className={cn('block group', className)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          {/*  */}
          <div className="w-24 h-24 flex-shrink-0">
            <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
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
              
              {/*  */}
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
          </div>

          {/*  */}
          <div className="flex-1 min-w-0">
            {/*  */}
            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
              {item.title}
            </h3>

            {/*  */}
            <div className="space-y-1 mb-3">
              {/*  */}
              {item.price > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">중고:</span>
                  <span className="font-semibold text-sm text-gray-900">
                    {item.price.toLocaleString()}원
                  </span>
                </div>
              )}
              
              {/*  */}
              {item.rentPrice > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">대여:</span>
                  <span className="font-semibold text-sm text-blue-600">
                    {item.rentPrice.toLocaleString()}원
                  </span>
                  <span className="text-xs text-gray-500">/일</span>
                </div>
              )}
              
              {/*  */}
              {item.price === 0 && item.rentPrice === 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">가격:</span>
                  <span className="font-semibold text-sm text-green-600">
                    무료
                  </span>
                </div>
              )}
            </div>

            {/*  */}
            {item.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
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

            {/*  */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span className="truncate">서울</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setWished((prev) => !prev)
                    toggleWish()
                  }}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart
                    size={12}
                    className={cn(wished ? 'fill-red-500 text-red-500' : 'text-gray-500')}
                  />
                  <span>{item.wishCount}</span>
                </button>
                <span></span>
                <span>{formatDistanceToNow(new Date(item.createdAt), { 
                  addSuffix: true, 
                  locale: ko 
                })}</span>
              </div>
            </div>
          </div>

          {/*  */}
          <div className="flex flex-col gap-2 items-end">
            {getTransactionTags().map((tag, index) => (
              <span
                key={index}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
                  tag.color
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
