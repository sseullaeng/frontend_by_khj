// 물품 카드 컴포넌트: 물품 정보 카드 UI 표시 및 상호작용
import { useState } from 'react'  // React 상태 훅
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { Heart, MapPin } from 'lucide-react'  // Lucide 아이콘들
import { formatDistanceToNow } from 'date-fns'  // 날짜 포맷팅 라이브러리
import { ko } from 'date-fns/locale'  // 한국어 로케일
import type { Item } from '../types'  // 물품 타입
import { cn } from '@/shared/lib/cn'  // Tailwind CSS 클래스 유틸리티
import { useToggleWish } from '../hooks'  // 찜하기 훅

// 물품 카드 props 타입
interface ItemCardProps {
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
 * 물품 카드 컴포넌트
 * 
 * 기능:
 * - 물품 정보 카드 표시
 * - 찜하기 토글 기능
 * - 거래 유형 태그 표시
 * - 상태 배지 표시
 * - 상세 페이지 링크
 * - 위치 및 시간 정보
 * 
 * UI 구조:
 * - 상단: 물품 이미지
 * - 중단: 물품 정보 (제목, 가격, 위치)
 * - 하단: 상태 및 태그
 */
export default function ItemCard({ item, className }: ItemCardProps) {
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
        {/* 상품 이미지 */}
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
          
          {/* 거래 태그 */}
          <div className="absolute top-2 left-2 flex flex-col gap-2 items-start">
            {getTransactionTags().slice(0, 2).map((tag, index) => (
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

          {/* 찜 버튼 */}
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
