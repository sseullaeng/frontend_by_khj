// 찜 목록 페이지 컴포넌트: 사용자가 찜한 물품 목록 표시 및 관리
import { Link, useNavigate } from 'react-router-dom'  // React Router 훅 및 컴포넌트
import { Heart, ChevronLeft, ArrowRight, MapPin } from 'lucide-react'  // Lucide 아이콘들
import { useWishList } from '@/features/item/hooks'  // 찜 목록 조회 훅
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 관리 스토어
import { fromNow } from '@/shared/lib/date'  // 날짜 포맷팅 유틸리티
import { cn } from '@/shared/lib/cn'  // Tailwind CSS 클래스 유틸리티

// 거래 유형 색상 맵핑 (백엔드 한글 enum)
const TYPE_COLOR: Record<string, string> = {
  '판매': 'bg-blue-100 text-blue-700',
  '대여': 'bg-green-100 text-green-700',
  '나눔': 'bg-purple-100 text-purple-700',
}

/**
 * 찜 목록 페이지 컴포넌트
 * 
 * 기능:
 * - 사용자가 찜한 물품 목록 표시
 * - 자신이 등록한 물품 필터링
 * - 물품 상세 페이지로 이동
 * - 찜 해제 기능
 * - 거래 유형별 색상 구분
 * 
 * UI 구조:
 * - 상단: 페이지 제목 및 뒤로가기 버튼
 * - 중단: 찜한 물품 카드 목록
 * - 각 카드: 물품 이미지, 정보, 가격, 상태 등
 */
export default function WishListPage() {
  const navigate = useNavigate()  // 페이지 네비게이션 함수
  const currentUser = useAuthStore((s) => s.user)  // 현재 사용자 정보
  const { data, isLoading } = useWishList()  // 찜 목록 조회 훅
  
  // 자신이 등록한 물품은 제외한 찜 목록 필터링
  const items = (data?.content ?? []).filter((item) => item.sellerId !== currentUser?.id)

  return (
    <div className="max-w-5xl mx-auto w-full pb-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">찜 목록</h1>
        <span className="text-sm text-gray-400 ml-auto">총 {items.length}건</span>
      </div>

      {isLoading && (
        <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Heart size={48} className="mb-4 opacity-30" />
          <p className="text-sm">찜한 상품이 없어요</p>
          <p className="text-xs mt-1">마음에 드는 상품에 하트를 눌러보세요</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/items/${item.id}`}
                className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', TYPE_COLOR[item.tradeType])}>
                      {item.tradeType}
                    </span>
                  </div>

                  <p className="font-medium text-gray-900 truncate mb-1">{item.title}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-900">
                      {item.tradeType === '나눔' ? '무료 나눔' : `${item.price.toLocaleString()}원`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <MapPin size={11} />
                    <span>{item.region ?? '지역 미설정'}</span>
                    <span>·</span>
                    <span>{fromNow(item.createdAt)}</span>
                    <span>·</span>
                    <Heart size={11} className="fill-red-400 text-red-400" />
                    <span>{item.wishlistCount}</span>
                  </div>
                </div>

                <ArrowRight className="text-gray-400 mt-1 shrink-0" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
