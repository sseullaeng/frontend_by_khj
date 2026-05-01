// 내 거래 목록 페이지 컴포넌트: 사용자의 거래 내역 목록 관리
import { useState } from 'react'  // React 상태 훅
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { ShoppingBag, ChevronLeft, User, Shield, Handshake } from 'lucide-react'  // Lucide 아이콘들
import { useMyTrades } from '@/features/trade/hooks'  // 거래 관련 훅
import { fromNow } from '@/shared/lib/date'  // 날짜 포맷팅 유틸리티
import { cn } from '@/shared/lib/cn'  // Tailwind CSS 클래스 유틸리티
import type { Trade, TradeStatus } from '@/features/item/types'  // 거래 관련 타입

// 탭 필터 타입 정의
type TabFilter = 'ALL' | 'RENT_PROVIDE' | 'RENT_STATUS' | 'USED_BUY' | 'USED_SELL'  // 전체/대여제공/대여현황/중고구매/중고판매

// 탭 필터 설정: 각 탭의 라벨 및 필터링 조건 정의
const TAB_FILTERS: Record<TabFilter, { label: string; icon?: React.ComponentType<any> }> = {
  ALL: { label: '전체보기' },           // 전체 거래 보기
  RENT_PROVIDE: { label: '대여제공' },   // 내가 제공하는 대여 (내가 판매자인 대여)
  RENT_STATUS: { label: '대여현황' },   // 내가 대여중인 현황 (내가 구매자인 대여)
  USED_BUY: { label: '중고구매' },      // 내가 구매한 중고거래
  USED_SELL: { label: '중고판매' },     // 내가 판매한 중고거래
}

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

export default function MyItemsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL')  // 활성 탭 상태 관리 (기본값: 전체보기)
  const { data, isLoading } = useMyTrades()
  const trades = data ?? []

  /**
   * 거래 필터링 함수
   * @param trades - 전체 거래 배열
   * @param filter - 필터 타입
   * @returns 필터링된 거래 배열
   */
  const filterTrades = (trades: Trade[], filter: TabFilter): Trade[] => {
    switch (filter) {
      case 'ALL':
        return trades  // 전체 거래 반환
      case 'RENT_PROVIDE':
        return trades.filter(trade => !trade.isBuyer && trade.item.itemType === 'RENT')  // 내가 제공하는 대여 (판매자인 대여)
      case 'RENT_STATUS':
        return trades.filter(trade => trade.isBuyer && trade.item.itemType === 'RENT')   // 내가 대여중인 현황 (구매자인 대여)
      case 'USED_BUY':
        return trades.filter(trade => trade.isBuyer && trade.item.itemType === 'SELL')  // 내가 구매한 중고거래
      case 'USED_SELL':
        return trades.filter(trade => !trade.isBuyer && trade.item.itemType === 'SELL') // 내가 판매한 중고거래
      default:
        return trades
    }
  }

  // 활성 탭에 따라 필터링된 거래 목록
  const filteredTrades = filterTrades(trades, activeTab)

  return (
    <div className="pb-10">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">내 거래</h1>
        <span className="text-sm text-gray-400 ml-auto">총 {trades.length}건</span>
      </div>

      {/* 탭 필터 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {(Object.keys(TAB_FILTERS) as TabFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveTab(filter)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === filter
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {TAB_FILTERS[filter].label}
            </button>
          ))}
        </nav>
      </div>

      {/* 거래 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">거래 내역을 불러오는 중...</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {activeTab === 'ALL' 
              ? '거래 내역이 없습니다' 
              : `${TAB_FILTERS[activeTab].label} 내역이 없습니다`
            }
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredTrades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              onView={() => navigate(`/trades/${trade.id}`)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function TradeRow({
  trade,
  onView,
}: {
  trade: Trade
  onView: () => void
}) {
  const status = TRADE_STATUS_CONFIG[trade.status]

  return (
    <li className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl">
      {/* 이미지 — 클릭 시 거래 상세 */}
      <button onClick={onView} className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 hover:opacity-90 transition-opacity">
        {trade.item.imageUrls[0] ? (
          <img src={trade.item.imageUrls[0]} alt={trade.item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={20} className="text-gray-300" />
          </div>
        )}
      </button>

      {/* 내용 */}
      <button onClick={onView} className="flex-1 min-w-0 text-left">
        {/* 배지 */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', status.color)}>
            {status.label}
          </span>
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', TYPE_COLOR[trade.item.itemType])}>
            {TYPE_LABEL[trade.item.itemType]}
          </span>
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            trade.isBuyer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          )}>
            {trade.isBuyer ? '구매' : '판매'}
          </span>
          <span className={cn(
            'flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full',
            trade.item.isEscrow
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-500'
          )}>
            {trade.item.isEscrow
              ? <><Shield size={10} /> 거래대행</>
              : <><Handshake size={10} /> 직접거래</>
            }
          </span>
        </div>

        {/* 제목 */}
        <p className="font-medium text-gray-900 truncate text-sm mb-1">{trade.item.title}</p>

        {/* 가격 */}
        <p className="text-sm font-semibold text-gray-900 mb-1.5">
          {trade.item.itemType === 'SHARE' ? '무료 나눔' : `${trade.item.price.toLocaleString()}원`}
        </p>

        {/* 거래 상대방 + 날짜 */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <User size={11} />
            <span className="text-gray-600 font-medium">{trade.counterpart.nickname}</span>
          </span>
          <span>{fromNow(trade.createdAt)}</span>
        </div>
      </button>
    </li>
  )
}
