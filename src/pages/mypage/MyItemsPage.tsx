// 내 거래 목록 페이지 컴포넌트: 사용자의 거래 내역 목록 관리
import { useState } from 'react'  // React 상태 훅
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { ShoppingBag, ChevronLeft, User, Shield, Handshake, ChevronDown } from 'lucide-react'  // Lucide 아이콘들
import { useMyTrades } from '@/features/trade/hooks'  // 거래 관련 훅
import { fromNow } from '@/shared/lib/date'  // 날짜 포맷팅 유틸리티
import { cn } from '@/shared/lib/cn'  // Tailwind CSS 클래스 유틸리티
import type { Trade, TradeStatus } from '@/features/item/types'  // 거래 관련 타입

// 탭 필터 타입 정의
type TabFilter = 'ALL' | 'RENT_PROVIDE' | 'RENT_STATUS' | 'USED_BUY' | 'USED_SELL'  // 전체/대여제공/대여현황/중고구매/중고판매

// 대여 하위 필터 타입 정의 (대여제공/대여현황 탭 전용)
type RentSubFilter = 'ALL' | 'ACTIVE' | 'COMPLETED'  // 전체/대여중/대여완료

// 탭 필터 설정: 각 탭의 라벨 정의
const TAB_FILTERS: Record<TabFilter, { label: string }> = {
  ALL:          { label: '전체보기' },    // 전체 거래 보기
  RENT_PROVIDE: { label: '대여제공' },   // 내가 제공하는 대여 (내가 판매자인 대여)
  RENT_STATUS:  { label: '대여현황' },   // 내가 대여중인 현황 (내가 구매자인 대여)
  USED_BUY:     { label: '중고구매' },   // 내가 구매한 중고거래
  USED_SELL:    { label: '중고판매' },   // 내가 판매한 중고거래
}

// 대여 하위 필터 라벨 정의
const RENT_SUB_FILTERS: Record<RentSubFilter, string> = {
  ALL:       '전체',      // 대여 전체
  ACTIVE:    '대여중',    // 현재 대여 진행 중
  COMPLETED: '대여완료',  // 대여 완료된 항목
}

// 거래 상태 설정: 상태별 라벨 및 색상 정의
const TRADE_STATUS_CONFIG: Record<TradeStatus, { label: string; color: string }> = {
  ACTIVE:    { label: '진행중',   color: 'text-green-600 bg-green-100' },   // 진행 중 상태
  COMPLETED: { label: '거래완료', color: 'text-blue-600 bg-blue-100' },     // 거래 완료
  CANCELLED: { label: '거래취소', color: 'text-red-600 bg-red-100' },       // 거래 취소
}

// 거래 유형 라벨 맵핑
const TYPE_LABEL: Record<string, string> = {
  SELL:  '중고거래',  // 판매
  RENT:  '대여',      // 대여
  SHARE: '나눔',      // 나눔
}

// 거래 유형 색상 맵핑
const TYPE_COLOR: Record<string, string> = {
  SELL:  'bg-blue-100 text-blue-700',     // 판매 색상
  RENT:  'bg-green-100 text-green-700',   // 대여 색상
  SHARE: 'bg-purple-100 text-purple-700', // 나눔 색상
}

/**
 * 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 * @param dateStr - ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

/**
 * 반납 예정일까지 남은 일수 계산
 * @param endDate - 반납 예정일 (ISO 날짜 문자열)
 * @returns 양수: 남은 일수, 음수: 연체 일수
 */
function daysUntilReturn(endDate: string): number {
  const end  = new Date(endDate)
  const now  = new Date()
  // 시간 정보 제거 후 날짜 기준으로 비교
  end.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// 내 거래 페이지 메인 컴포넌트
export default function MyItemsPage() {
  const navigate = useNavigate()
  // 활성 탭 상태 (기본값: 전체보기)
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL')
  // 대여 하위 필터 상태 (기본값: 전체)
  const [rentSubFilter, setRentSubFilter] = useState<RentSubFilter>('ALL')
  // 대여 드롭다운 열림 상태
  const [rentDropdownOpen, setRentDropdownOpen] = useState(false)
  // 거래 목록 조회
  const { data, isLoading } = useMyTrades()
  const trades = data ?? []

  // 현재 탭이 대여 관련 탭인지 여부
  const isRentTab = activeTab === 'RENT_PROVIDE' || activeTab === 'RENT_STATUS'

  /**
   * 탭 전환 핸들러: 탭 변경 시 하위 필터 초기화
   * @param filter - 선택된 탭 필터
   */
  const handleTabChange = (filter: TabFilter) => {
    setActiveTab(filter)
    setRentSubFilter('ALL')    // 탭 변경 시 드롭다운 필터 초기화
    setRentDropdownOpen(false) // 드롭다운 닫기
  }

  /**
   * 메인 탭 필터링 함수
   * @param trades - 전체 거래 배열
   * @param filter - 탭 필터 타입
   * @returns 탭 기준으로 필터링된 거래 배열
   */
  const filterByTab = (trades: Trade[], filter: TabFilter): Trade[] => {
    switch (filter) {
      case 'ALL':          return trades  // 전체 반환
      case 'RENT_PROVIDE': return trades.filter(t => !t.isBuyer && t.item.itemType === 'RENT')  // 판매자인 대여
      case 'RENT_STATUS':  return trades.filter(t =>  t.isBuyer && t.item.itemType === 'RENT')  // 구매자인 대여
      case 'USED_BUY':     return trades.filter(t =>  t.isBuyer && t.item.itemType === 'SELL')  // 구매한 중고
      case 'USED_SELL':    return trades.filter(t => !t.isBuyer && t.item.itemType === 'SELL')  // 판매한 중고
      default:             return trades
    }
  }

  /**
   * 대여 하위 필터링 함수 (대여 탭 전용)
   * @param trades - 탭 필터 이후의 거래 배열
   * @param sub - 대여 하위 필터 타입
   * @returns 하위 필터 기준으로 필터링된 거래 배열
   */
  const filterByRentSub = (trades: Trade[], sub: RentSubFilter): Trade[] => {
    if (sub === 'ALL') return trades
    if (sub === 'ACTIVE')    return trades.filter(t => !t.isReturned)  // 미반납 = 대여중
    if (sub === 'COMPLETED') return trades.filter(t =>  t.isReturned)  // 반납완료 = 대여완료
    return trades
  }

  // 탭 + 대여 하위 필터를 순서대로 적용한 최종 거래 목록
  const tabFiltered  = filterByTab(trades, activeTab)
  const filteredTrades = isRentTab ? filterByRentSub(tabFiltered, rentSubFilter) : tabFiltered

  return (
    <div className="pb-10">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">내 거래</h1>
        {/* 전체 거래 건수 표시 */}
        <span className="text-sm text-gray-400 ml-auto">총 {trades.length}건</span>
      </div>

      {/* 탭 필터 네비게이션 */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-6 overflow-x-auto">
          {(Object.keys(TAB_FILTERS) as TabFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => handleTabChange(filter)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                activeTab === filter
                  ? 'border-blue-500 text-blue-600'         // 활성 탭 스타일
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'  // 비활성 탭 스타일
              )}
            >
              {TAB_FILTERS[filter].label}
            </button>
          ))}
        </nav>
      </div>

      {/* 대여 탭 전용 하위 필터 드롭다운 */}
      {isRentTab && (
        <div className="relative mb-4 flex justify-end">
          {/* 드롭다운 토글 버튼 */}
          <button
            onClick={() => setRentDropdownOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>{RENT_SUB_FILTERS[rentSubFilter]}</span>
            <ChevronDown
              size={14}
              className={cn('transition-transform', rentDropdownOpen && 'rotate-180')}
            />
          </button>

          {/* 드롭다운 메뉴 */}
          {rentDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
              {(Object.keys(RENT_SUB_FILTERS) as RentSubFilter[]).map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setRentSubFilter(sub)
                    setRentDropdownOpen(false)  // 선택 후 드롭다운 닫기
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-colors',
                    rentSubFilter === sub
                      ? 'bg-blue-50 text-blue-600 font-medium'  // 선택된 항목 스타일
                      : 'text-gray-700 hover:bg-gray-50'        // 일반 항목 스타일
                  )}
                >
                  {RENT_SUB_FILTERS[sub]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 거래 목록 영역 */}
      {isLoading ? (
        // 로딩 상태 표시
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">거래 내역을 불러오는 중...</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        // 빈 목록 상태 표시
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
        // 거래 목록 렌더링
        <ul className="space-y-3">
          {filteredTrades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              isRentTab={isRentTab}
              onView={() => navigate(`/trades/${trade.id}`)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// 거래 행 컴포넌트 Props 타입 정의
interface TradeRowProps {
  trade: Trade       // 거래 데이터
  isRentTab: boolean // 대여 탭 여부 (반납일 패널 표시 여부 결정)
  onView: () => void // 거래 상세 보기 핸들러
}

/**
 * 거래 목록의 단일 행 컴포넌트
 * 대여 탭일 경우 오른쪽에 반납일자 및 반납 상태 표시
 */
function TradeRow({ trade, isRentTab, onView }: TradeRowProps) {
  // 거래 상태 라벨/색상 정보
  const status = TRADE_STATUS_CONFIG[trade.status]

  // 대여 탭이고 반납 예정일이 있을 때만 반납 정보 계산
  const showRentInfo = isRentTab && !!trade.rentEndDate
  const daysLeft     = showRentInfo ? daysUntilReturn(trade.rentEndDate!) : null

  /**
   * D-N 표시 색상 결정
   * 연체: 빨간색 / 3일 이내: 황색 / 정상: 초록색
   */
  const dCountColor = daysLeft === null
    ? ''
    : daysLeft < 0
      ? 'text-red-600'   // 연체
      : daysLeft <= 3
        ? 'text-amber-500' // 촉박
        : 'text-green-600' // 여유

  return (
    <li className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl">
      {/* 물품 이미지 — 클릭 시 거래 상세 이동 */}
      <button
        onClick={onView}
        className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 hover:opacity-90 transition-opacity"
        aria-label={`${trade.item.title} 상세 보기`}
      >
        {trade.item.imageUrls[0] ? (
          <img src={trade.item.imageUrls[0]} alt={trade.item.title} className="w-full h-full object-cover" />
        ) : (
          // 이미지 없을 때 기본 아이콘 표시
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={20} className="text-gray-300" />
          </div>
        )}
      </button>

      {/* 거래 정보 영역 (클릭 시 상세 이동) */}
      <button onClick={onView} className="flex-1 min-w-0 text-left">
        {/* 상태 배지 목록 */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {/* 거래 상태 배지 */}
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', status.color)}>
            {status.label}
          </span>
          {/* 거래 유형 배지 (중고/대여/나눔) */}
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', TYPE_COLOR[trade.item.itemType])}>
            {TYPE_LABEL[trade.item.itemType]}
          </span>
          {/* 구매/판매 역할 배지 */}
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            trade.isBuyer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          )}>
            {trade.isBuyer ? '구매' : '판매'}
          </span>
          {/* 거래 방식 배지 (거래대행/직접거래) */}
          <span className={cn(
            'flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full',
            trade.item.isEscrow
              ? 'bg-indigo-100 text-indigo-700'  // 거래대행 색상
              : 'bg-gray-100 text-gray-500'       // 직접거래 색상
          )}>
            {trade.item.isEscrow
              ? <><Shield size={10} /> 거래대행</>
              : <><Handshake size={10} /> 직접거래</>
            }
          </span>
        </div>

        {/* 물품 제목 */}
        <p className="font-medium text-gray-900 truncate text-sm mb-1">{trade.item.title}</p>

        {/* 가격 정보 */}
        <p className="text-sm font-semibold text-gray-900 mb-1.5">
          {trade.item.itemType === 'SHARE'
            ? '무료 나눔'
            : trade.item.itemType === 'RENT'
              ? `${trade.item.rentPrice.toLocaleString()}원/일`  // 대여가 표시
              : `${trade.item.price.toLocaleString()}원`          // 판매가 표시
          }
        </p>

        {/* 거래 상대방 닉네임 + 등록 시각 */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <User size={11} />
            <span className="text-gray-600 font-medium">{trade.counterpart.nickname}</span>
          </span>
          <span>{fromNow(trade.createdAt)}</span>
        </div>
      </button>

      {/* 대여 탭 전용: 반납일자 및 반납 상태 패널 */}
      {showRentInfo && (
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
          {/* 반납 예정일 */}
          <p className="text-xs text-gray-500">
            반납일: <span className="font-medium text-gray-700">{formatDate(trade.rentEndDate!)}</span>
          </p>

          {/* D-N 카운트다운 */}
          <p className={cn('text-xs font-bold', dCountColor)}>
            {daysLeft === 0
              ? 'D-Day'
              : daysLeft! > 0
                ? `D-${daysLeft}`       // 남은 일수
                : `D+${Math.abs(daysLeft!)}` // 연체 일수
            }
          </p>

          {/* 반납 완료 / 미반납 배지 */}
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            trade.isReturned
              ? 'bg-blue-100 text-blue-600'   // 반납완료 스타일
              : 'bg-red-100 text-red-600'     // 미반납 스타일
          )}>
            {trade.isReturned ? '반납완료' : '미반납'}
          </span>
        </div>
      )}
    </li>
  )
}
