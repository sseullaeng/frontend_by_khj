// 물품 리스트 아이템 컴포넌트: 리스트 형태의 물품 정보 표시
import { useState } from 'react'  // React 상태 훅
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { Heart, MapPin } from 'lucide-react'  // Lucide 아이콘들
import { formatDistanceToNow } from 'date-fns'  // 날짜 포맷팅 라이브러리
import { ko } from 'date-fns/locale'  // 한국어 로케일
import type { Item } from '../types'  // 물품 타입
import { cn } from '@/shared/lib/cn'  // Tailwind CSS 클래스 유틸리티
import { useToggleWish } from '../hooks'  // 찜하기 훅

// 물품 리스트 아이템 props 타입
interface ItemListItemProps {
  item: Item          // 물품 정보
  className?: string  // 추가 CSS 클래스
}

// 물품 상태별 색상 설정
const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',    // 판매중: 녹색
  RESERVED: 'bg-yellow-100 text-yellow-800',  // 예약중: 노란색
  SOLD: 'bg-gray-100 text-gray-800',        // 판매완료: 회색
  HIDDEN: 'bg-red-100 text-red-800',        // 숨김: 빨간색
} as const

/**
 * 물품 리스트 아이템 컴포넌트
 * 
 * 기능:
 * - 리스트 형태 물품 정보 표시
 * - 찜하기 토글 기능
 * - 거래 유형 태그 표시
 * - 상태 배지 표시
 * - 상세 페이지 링크
 * - 위치 및 시간 정보
 * 
 * UI 구조:
 * - 좌측: 물품 이미지
 * - 우측: 물품 정보 (제목, 가격, 위치, 상태)
 * - 상단: 찜하기 버튼
 */
export default function ItemListItem({ item, className }: ItemListItemProps) {
  const [wished, setWished] = useState(item.isWished)  // 찜하기 상태
  const { mutate: toggleWish } = useToggleWish(item.id)  // 찜하기 토글 훅
  
  // 여러 거래유형 태그 생성 함수
  const getTransactionTags = () => {
    const tags = []
    if (item.price > 0) tags.push({ label: '중고거래', color: 'bg-blue-100 text-blue-800' })  // 판매 가격이 있으면 중고거래 태그
    if (item.rentPrice > 0) tags.push({ label: '대여', color: 'bg-green-100 text-green-800' })  // 대여 가격이 있으면 대여 태그
    if (item.price === 0 && item.rentPrice === 0) tags.push({ label: '나눔', color: 'bg-purple-100 text-purple-800' })
    if (item.isEscrow) tags.push({ label: '거래대행', color: 'bg-indigo-100 text-indigo-700' })
    return tags
  }
  
  return (
    <Link to={`/items/${item.id}`} className={cn('block group', className)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          {/* 상품 이미지 */}
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
          </div>

          {/* 상품 정보 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
              {item.title}
            </h3>

            <div className="space-y-1 mb-3">
              {item.price > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">중고:</span>
                  <span className="font-semibold text-sm text-gray-900">
                    {item.price.toLocaleString()}원
                  </span>
                </div>
              )}
              
              {item.rentPrice > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">대여:</span>
                  <span className="font-semibold text-sm text-blue-600">
                    {item.rentPrice.toLocaleString()}원
                  </span>
                  <span className="text-xs text-gray-500">/일</span>
                </div>
              )}
              
              {item.price === 0 && item.rentPrice === 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-500">가격:</span>
                  <span className="font-semibold text-sm text-green-600">
                    무료
                  </span>
                </div>
              )}
            </div>

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
