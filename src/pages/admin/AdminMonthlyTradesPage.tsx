// 관리자 이번달 거래 내역 페이지: 내 거래 페이지와 동일한 탭 구조로 전체 거래 조회
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingBag, ChevronLeft, ChevronRight, ChevronDown, CalendarSearch } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// ─── 타입 ──────────────────────────────────────────────────────────────────

/** 거래 유형: 중고 / 대여 / 나눔 / 거래대행 */
type TradeType = 'SELL' | 'RENT' | 'SHARE' | 'ESCROW'
/** 거래 상태: 진행중 / 완료 / 취소 */
type TradeStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

/** 관리자 거래 정보 */
interface AdminTrade {
  id: number
  itemTitle: string
  itemType: TradeType
  tradeStatus: TradeStatus
  price: number
  buyerNickname: string
  sellerNickname: string
  date: string             // YYYY-MM-DD
}

// ─── 상수 ──────────────────────────────────────────────────────────────────

/** 거래 유형별 이모지 */
const TRADE_EMOJI: Record<TradeType, string> = {
  SELL:   '🛒',
  RENT:   '🔄',
  SHARE:  '🤝',
  ESCROW: '🛡️',
}

/** 거래 유형별 한글 레이블 */
const TYPE_LABEL: Record<TradeType, string> = {
  SELL:   '중고거래',
  RENT:   '대여',
  SHARE:  '나눔',
  ESCROW: '거래대행',
}

/** 거래 유형별 뱃지 색상 */
const TYPE_CLS: Record<TradeType, string> = {
  SELL:   'bg-orange-100 text-orange-700',
  RENT:   'bg-blue-100 text-blue-700',
  SHARE:  'bg-green-100 text-green-700',
  ESCROW: 'bg-purple-100 text-purple-700',
}

/** 거래 상태별 한글 레이블 */
const STATUS_LABEL: Record<TradeStatus, string> = {
  ACTIVE:    '거래중',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

/** 거래 상태별 뱃지 색상 */
const STATUS_CLS: Record<TradeStatus, string> = {
  ACTIVE:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

/** 거래 유형 기본 탭 (내 거래 페이지 동일 구조) */
type TypeTabKey = 'ALL' | 'RENT_P' | 'RENT_S' | 'SELL_B' | 'SELL_S' | 'SHARE' | 'ESCROW'
const TYPE_TABS: { key: TypeTabKey; label: string; type: TradeType | null }[] = [
  { key: 'ALL',    label: '전체보기', type: null },
  { key: 'RENT_P', label: '대여제공', type: 'RENT' },
  { key: 'RENT_S', label: '대여현황', type: 'RENT' },
  { key: 'SELL_B', label: '중고구매', type: 'SELL' },
  { key: 'SELL_S', label: '중고판매', type: 'SELL' },
  { key: 'SHARE',  label: '나눔',     type: 'SHARE' },
  { key: 'ESCROW', label: '거래대행', type: 'ESCROW' },
]

/** 거래 상태 하위 필터 (대여 탭 제외 전체 탭에서 사용) */
type StatusTabKey = 'ALL' | TradeStatus
const STATUS_TABS: { key: StatusTabKey; label: string }[] = [
  { key: 'ALL',       label: '전체' },
  { key: 'ACTIVE',    label: '거래중' },
  { key: 'COMPLETED', label: '완료' },
  { key: 'CANCELLED', label: '취소' },
]

/** 이번달 거래 목업 데이터 */
const MOCK_TRADES: AdminTrade[] = [
  { id: 1,  itemTitle: '아이폰 15 Pro',          itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 1100000, buyerNickname: '홍길동',     sellerNickname: '이철수',     date: '2026-05-02' },
  { id: 2,  itemTitle: '캠핑 텐트 대여',          itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 25000,   buyerNickname: '최수진',     sellerNickname: '테스트유저', date: '2026-05-01' },
  { id: 3,  itemTitle: '어린이 장난감 나눔',       itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '정우성',     sellerNickname: '손예진',     date: '2026-05-01' },
  { id: 4,  itemTitle: '맥북 에어 M2',            itemType: 'SELL',   tradeStatus: 'ACTIVE',    price: 1400000, buyerNickname: '강동원',     sellerNickname: '유재석',     date: '2026-04-30' },
  { id: 5,  itemTitle: '전동 킥보드 대여',        itemType: 'RENT',   tradeStatus: 'CANCELLED', price: 15000,   buyerNickname: '박민준',     sellerNickname: '최수진',     date: '2026-04-30' },
  { id: 6,  itemTitle: '타 플랫폼 거래 대행',     itemType: 'ESCROW', tradeStatus: 'ACTIVE',    price: 350000,  buyerNickname: '테스트유저', sellerNickname: '홍길동',     date: '2026-04-29' },
  { id: 7,  itemTitle: '빈티지 자켓',             itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 45000,   buyerNickname: '김영희',     sellerNickname: '정우성',     date: '2026-04-29' },
  { id: 8,  itemTitle: 'DSLR 카메라 대여',        itemType: 'RENT',   tradeStatus: 'COMPLETED', price: 80000,   buyerNickname: '이철수',     sellerNickname: '강동원',     date: '2026-04-28' },
  { id: 9,  itemTitle: '아기 옷 나눔',            itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '손예진',     sellerNickname: '유재석',     date: '2026-04-28' },
  { id: 10, itemTitle: 'PS5 본체',               itemType: 'SELL',   tradeStatus: 'CANCELLED', price: 680000,  buyerNickname: '신동엽',     sellerNickname: '이철수',     date: '2026-04-27' },
  { id: 11, itemTitle: '자전거 대여',             itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 10000,   buyerNickname: '최수진',     sellerNickname: '테스트유저', date: '2026-04-27' },
  { id: 12, itemTitle: '전자레인지',              itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 55000,   buyerNickname: '정우성',     sellerNickname: '손예진',     date: '2026-04-26' },
]

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────

export default function AdminMonthlyTradesPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()

  // URL 파라미터로 전달된 날짜 범위·상태 필터 (차트 클릭 시 전달)
  const urlStart  = searchParams.get('start')
  const urlEnd    = searchParams.get('end')
  const urlStatus = searchParams.get('status') as StatusTabKey | null

  // 날짜 범위 상태 (URL 파라미터 우선, 없으면 전체 목업 기간)
  const [startDate, setStartDate] = useState(urlStart ?? '2026-04-26')
  const [endDate,   setEndDate]   = useState(urlEnd   ?? '2026-05-02')

  // 유형 탭 상태 (기본값: 전체보기)
  const [typeTab, setTypeTab] = useState<TypeTabKey>('ALL')
  // 상태 드롭다운 필터 상태 (URL 파라미터 우선)
  const [statusFilter, setStatusFilter] = useState<StatusTabKey>(
    urlStatus && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(urlStatus)
      ? urlStatus
      : 'ALL'
  )
  // 상태 드롭다운 열림 여부
  const [statusDropOpen, setStatusDropOpen] = useState(false)

  // 날짜 범위 필터 → 유형 탭 → 상태 필터 순서로 적용
  const byDate = MOCK_TRADES.filter(t => t.date >= startDate && t.date <= endDate)
  const byType = byDate.filter(t => {
    const tab = TYPE_TABS.find(tb => tb.key === typeTab)
    return tab?.type === null || t.itemType === tab?.type
  })
  const filtered = byType.filter(t =>
    statusFilter === 'ALL' || t.tradeStatus === statusFilter
  )

  return (
    <div className="pb-10">

      {/* 뒤로가기 버튼 + 페이지 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">이번달 거래 내역</h1>
        </div>
        <span className="text-sm text-gray-400 ml-auto">총 {byDate.length}건</span>
      </div>

      {/* 날짜 범위 필터 카드 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarSearch size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-700">조회 기간</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 시작 날짜 */}
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={e => setStartDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white"
          />
          <span className="text-gray-400 text-sm shrink-0">~</span>
          {/* 종료 날짜 */}
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white"
          />
        </div>
      </div>

      {/* 요약 카드 (거래 상태별) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '거래중', value: byDate.filter(t => t.tradeStatus === 'ACTIVE').length,    cls: 'text-blue-600' },
          { label: '완료',   value: byDate.filter(t => t.tradeStatus === 'COMPLETED').length,  cls: 'text-emerald-600' },
          { label: '취소',   value: byDate.filter(t => t.tradeStatus === 'CANCELLED').length,  cls: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 유형 탭 네비게이션 (내 거래 페이지와 동일 구조) */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex overflow-x-auto">
          {TYPE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setTypeTab(tab.key)}
              className={cn(
                'shrink-0 py-2.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                typeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 거래 상태 드롭다운 필터 (우측 정렬) */}
      <div className="relative mb-4 flex justify-end">
        <button
          onClick={() => setStatusDropOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>{STATUS_TABS.find(t => t.key === statusFilter)?.label ?? '전체'}</span>
          <ChevronDown size={14} className={cn('transition-transform', statusDropOpen && 'rotate-180')} />
        </button>
        {statusDropOpen && (
          <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[90px]">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setStatusDropOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  statusFilter === tab.key
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 거래 목록 */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">해당 거래가 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(trade => (
            <li key={trade.id}>
              <button
                onClick={() => navigate(`/items/${trade.id}`)}
                className="w-full flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl text-left hover:shadow-sm transition-shadow"
              >
                {/* 유형 이모지 아이콘 */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xl">{TRADE_EMOJI[trade.itemType]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* 유형 뱃지 + 상태 뱃지 */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', TYPE_CLS[trade.itemType])}>
                      {TYPE_LABEL[trade.itemType]}
                    </span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_CLS[trade.tradeStatus])}>
                      {STATUS_LABEL[trade.tradeStatus]}
                    </span>
                  </div>
                  {/* 물품 제목 */}
                  <p className="text-sm font-semibold text-gray-900 truncate">{trade.itemTitle}</p>
                  {/* 가격 + 판매자→구매자 */}
                  <p className="text-xs text-gray-400">
                    {trade.price > 0 ? trade.price.toLocaleString() + '원' : '무료'} ·{' '}
                    {trade.sellerNickname} → {trade.buyerNickname}
                  </p>
                  {/* 거래 날짜 */}
                  <p className="text-xs text-gray-400">{trade.date}</p>
                </div>

                <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}
