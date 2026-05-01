// 거래 내역 상세 페이지 컴포넌트: 특정 거래의 상세 정보 표시
import { useNavigate, useParams } from 'react-router-dom'  // React Router 훅
import { ChevronLeft, User, Calendar, MapPin, ShoppingBag, Shield, Handshake } from 'lucide-react'  // Lucide 아이콘들
import { useTradeDetail } from '@/features/trade/hooks'  // 거래 관련 훅
import { fromNow } from '@/shared/lib/date'  // 날짜 포맷팅 유틸리티
import { cn } from '@/shared/lib/cn'  // Tailwind CSS 클래스 유틸리티
import type { TradeStatus } from '@/features/item/types'  // 거래 관련 타입

// 거래 상태 설정: 상태별 라벨 및 색상 정의
const TRADE_STATUS_CONFIG: Record<TradeStatus, { label: string; color: string }> = {
  ACTIVE:   { label: '진행중',   color: 'text-green-600 bg-green-100' },    // 진행 중 상태
  COMPLETED: { label: '거래완료', color: 'text-blue-600 bg-blue-100' },    // 거래 완료
  CANCELLED: { label: '거래취소', color: 'text-red-600 bg-red-100' },      // 거래 취소
}

// 거래 유형 라벨 맵핑
const TYPE_LABEL: Record<string, string> = {
  SELL: '중고거래',  // 판매
  RENT: '대여',      // 대여
  SHARE: '나눔',    // 나눔
}

// 거래 유형 색상 맵핑
const TYPE_COLOR: Record<string, string> = {
  SELL: 'bg-blue-100 text-blue-700',    // 판매 색상
  RENT: 'bg-green-100 text-green-700',  // 대여 색상
  SHARE: 'bg-purple-100 text-purple-700', // 나눔 색상
}

export default function TradeDetailPage() {
  const navigate = useNavigate()
  const { tradeId } = useParams<{ tradeId: string }>()
  console.log('TradeDetailPage - URL에서 가져온 tradeId:', tradeId)
  const { data: trade, isLoading } = useTradeDetail(Number(tradeId))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">거래 내역을 불러오는 중...</p>
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">거래 내역을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const handleItemClick = () => {
    console.log('물품 클릭 - 이동할 경로:', `/items/${trade.item.id}`)
    navigate(`/items/${trade.item.id}`)
  }

  return (
    <div className="pb-10">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">거래 내역</h1>
      </div>

      {/* 거래 상태 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={cn('px-3 py-1 text-sm font-medium rounded-full', TRADE_STATUS_CONFIG[trade.status].color)}>
            {TRADE_STATUS_CONFIG[trade.status].label}
          </span>
          <span className={cn('px-3 py-1 text-sm font-medium rounded-full', TYPE_COLOR[trade.item.itemType])}>
            {TYPE_LABEL[trade.item.itemType]}
          </span>
          <span className={cn(
            'px-3 py-1 text-sm font-medium rounded-full',
            trade.isBuyer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          )}>
            {trade.isBuyer ? '구매' : '판매'}
          </span>
          {trade.item.isEscrow && (
            <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700">
              <Shield size={12} />
              거래대행
            </span>
          )}
        </div>
      </div>

      {/* 물품 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <button 
          onClick={handleItemClick}
          className="w-full flex items-start gap-4 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          {/* 물품 이미지 */}
          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
            {trade.item.imageUrls[0] ? (
              <img src={trade.item.imageUrls[0]} alt={trade.item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={24} className="text-gray-300" />
              </div>
            )}
          </div>

          {/* 물품 정보 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 truncate">{trade.item.title}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{trade.item.description}</p>
            <p className="text-lg font-bold text-primary-600">
              {trade.item.itemType === 'SHARE' ? '무료 나눔' : `${trade.item.price.toLocaleString()}원`}
            </p>
            <p className="text-xs text-gray-400 mt-1">클릭하여 물품 상세 보기</p>
          </div>
        </button>
      </div>

      {/* 거래 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">거래 정보</h2>
        
        <div className="space-y-3">
          {/* 거래 일시 */}
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">거래 일시</p>
              <p className="text-sm font-medium text-gray-900">{fromNow(trade.createdAt)}</p>
            </div>
          </div>

          {/* 거래 장소 */}
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">거래 장소</p>
              <p className="text-sm font-medium text-gray-900">{trade.location || '미정'}</p>
            </div>
          </div>

          {/* 거래 방식 */}
          <div className="flex items-center gap-3">
            {trade.item.isEscrow ? (
              <Shield size={18} className="text-gray-400" />
            ) : (
              <Handshake size={18} className="text-gray-400" />
            )}
            <div>
              <p className="text-sm text-gray-600">거래 방식</p>
              <p className="text-sm font-medium text-gray-900">
                {trade.item.isEscrow ? '거래대행' : '직접거래'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 거래 상대방 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-4">거래 상대방</h2>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
            {trade.counterpart.profileImageUrl ? (
              <img src={trade.counterpart.profileImageUrl} alt={trade.counterpart.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-gray-900">{trade.counterpart.nickname}</p>
            <p className="text-sm text-gray-600">신뢰 지수: {trade.counterpart.trustScore ?? 0}점</p>
          </div>
        </div>
      </div>

      {/* 거래 완료 시 수정 불가 안내 */}
      {trade.status === 'COMPLETED' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">안내:</span> 거래가 완료된 내역은 수정할 수 없습니다.
          </p>
        </div>
      )}
    </div>
  )
}
