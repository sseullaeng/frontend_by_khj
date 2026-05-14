// 관리자 거래 검색 — 라운드8 백엔드 hook 연동
//
// 백엔드: GET /api/v1/admin/transactions
//   ?status=&buyerId=&sellerId=&page=&size=
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarSearch,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useAdminItemDetail, useAdminTransactions } from '@/features/admin/hooks'
import type { Transaction, TransactionStatus } from '@/features/transaction/types'
import { TRANSACTION_STATUS_LABEL } from '@/features/transaction/types'
import { formatKst } from '@/shared/lib/date'

// ─── 타입/상수 ─────────────────────────────────────────────────────────────

type BackendType = '판매' | '대여' | '나눔'
type BackendStatus = '진행중' | '채팅중' | '예약' | '거래완료' | '취소'

const TYPE_TABS: { key: 'ALL' | BackendType; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: '판매', label: '판매' },
  { key: '대여', label: '대여' },
  { key: '나눔', label: '나눔' },
]

const STATUS_TABS: { key: 'ALL' | BackendStatus; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: '진행중', label: '진행 중' },
  { key: '채팅중', label: '채팅 중' },
  { key: '예약', label: '예약' },
  { key: '거래완료', label: '거래 완료' },
  { key: '취소', label: '취소' },
]

// 백엔드 응답 Transaction.status (영문 enum) → 한국어 라벨 + 색상
const STATUS_CLS: Record<TransactionStatus, string> = {
  CHATTING: 'bg-blue-100 text-blue-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

// 라운드9: 백엔드 응답 tradeType (한글) → 뱃지 색상
const TRADE_TYPE_CLS: Record<BackendType, string> = {
  판매: 'bg-orange-100 text-orange-700',
  대여: 'bg-blue-100 text-blue-700',
  나눔: 'bg-green-100 text-green-700',
}

// 거래 응답에 type 필드가 별도로 안 와서 프론트에서 합리적 fallback — 가격이 0 이면 나눔, rentalUnit/period 가 있으면 대여, 그 외 판매
// 실제 spec 으로 합의되면 이 추정 제거 (TODO).

const todayLocal = () => new Date().toISOString().slice(0, 10)
const monthAgoLocal = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

// YYYY-MM-DD → ISO LocalDateTime
const toStartOfDay = (date: string) => `${date}T00:00:00`
const toEndOfDay = (date: string) => `${date}T23:59:59`

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────

export default function AdminMonthlyTradesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlStart = searchParams.get('start')
  const urlEnd = searchParams.get('end')
  const urlType = searchParams.get('type') as BackendType | null
  const urlStatus = searchParams.get('status') as BackendStatus | null
  const urlBuyerId = searchParams.get('buyerId')
  const urlSellerId = searchParams.get('sellerId')

  const [startDate, setStartDate] = useState(urlStart ?? monthAgoLocal())
  const [endDate, setEndDate] = useState(urlEnd ?? todayLocal())
  const [typeTab, setTypeTab] = useState<'ALL' | BackendType>(urlType ?? 'ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendStatus>(urlStatus ?? '진행중')
  const [statusDropOpen, setStatusDropOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [buyerId, setBuyerId] = useState(urlBuyerId ?? '')
  const [sellerId, setSellerId] = useState(urlSellerId ?? '')
  const [page, setPage] = useState(0)

  // 라운드9 PR #83: keyword 가 숫자면 ID 정확 매칭, 비숫자면 닉네임/이메일 LIKE
  const onKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
    setPage(0)
  }

  const params = useMemo(
    () => ({
      startDate: toStartOfDay(startDate),
      endDate: toEndOfDay(endDate),
      type: typeTab === 'ALL' ? undefined : typeTab,
      status: statusFilter === 'ALL' || statusFilter === '진행중' ? undefined : statusFilter,
      buyerId: buyerId.trim() ? Number(buyerId) : undefined,
      sellerId: sellerId.trim() ? Number(sellerId) : undefined,
      keyword: keyword.trim() || undefined,
      page,
      size: 20,
    }),
    [startDate, endDate, typeTab, statusFilter, keyword, buyerId, sellerId, page]
  )

  const { data, isLoading } = useAdminTransactions(params)
  const rawItems = data?.content ?? []
  const items = statusFilter === '진행중'
    ? rawItems.filter((trade) => trade.status === 'CHATTING' || trade.status === 'RESERVED')
    : rawItems
  const totalElements = statusFilter === '진행중' ? items.length : data?.totalElements ?? 0

  return (
    <div className="pb-10">
      {/* 뒤로가기 + 제목 */}
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
          <h1 className="text-lg font-bold text-gray-900">거래 내역</h1>
        </div>
        <span className="text-sm text-gray-400 ml-auto">총 {totalElements}건</span>
      </div>

      {/* 날짜 범위 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarSearch size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-700">조회 기간</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(0)
            }}
            className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400"
          />
          <span className="text-gray-400 text-sm shrink-0">~</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(0)
            }}
            className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* 거래/물품 ID 검색 */}
      <div className="relative mb-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={keyword}
          onChange={onKeywordChange}
          placeholder="거래/물품 ID 또는 회원 (홍길동, user@example.com, 12345)"
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
        {keyword && (
          <button
            onClick={() => {
              setKeyword('')
              setPage(0)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4 px-1">
        숫자: 거래/물품 ID 정확 매칭 · 그 외: 닉네임/이메일 검색 (top 200 user)
      </p>

      {/* 당사자 ID 필터 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <input
          value={buyerId}
          onChange={(e) => {
            setBuyerId(e.target.value.replace(/[^0-9]/g, ''))
            setPage(0)
          }}
          placeholder="구매자 ID"
          inputMode="numeric"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
        <input
          value={sellerId}
          onChange={(e) => {
            setSellerId(e.target.value.replace(/[^0-9]/g, ''))
            setPage(0)
          }}
          placeholder="판매자 ID"
          inputMode="numeric"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* 유형 탭 */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex overflow-x-auto">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setTypeTab(tab.key)
                setPage(0)
              }}
              className={cn(
                'shrink-0 py-2.5 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
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

      {/* 상태 드롭다운 */}
      <div className="relative mb-4 flex justify-end">
        <button
          onClick={() => setStatusDropOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>{STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? '전체'}</span>
          <ChevronDown
            size={14}
            className={cn('transition-transform', statusDropOpen && 'rotate-180')}
          />
        </button>
        {statusDropOpen && (
          <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key)
                  setStatusDropOpen(false)
                  setPage(0)
                }}
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
      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">해당 거래가 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((trade) => (
            <TradeItemRow key={trade.id} trade={trade} />
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm text-gray-600">
          <button
            disabled={!data.hasPrevious}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5">
            {data.page + 1} / {data.totalPages}
          </span>
          <button
            disabled={!data.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

function TradeItemRow({ trade }: { trade: Transaction }) {
  const navigate = useNavigate()
  const { data: adminItem } = useAdminItemDetail(trade.itemId)
  const item = adminItem?.item
  const imageUrl =
    trade.itemImageUrl ??
    item?.thumbnailUrl ??
    item?.images.find((image) => image.thumbnail)?.imageUrl ??
    item?.images[0]?.imageUrl ??
    null
  const title = trade.itemTitle || item?.title || `물품 #${trade.itemId}`
  const type = trade.tradeType ?? item?.tradeType

  return (
    <li>
      <button
        onClick={() => navigate(`/items/${trade.itemId}`)}
        className="w-full flex items-stretch gap-4 p-4 bg-white border border-gray-200 rounded-xl text-left hover:shadow-sm transition-shadow"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag size={28} className="text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {type && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  TRADE_TYPE_CLS[type]
                )}
              >
                {type}
              </span>
            )}
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                STATUS_CLS[trade.status]
              )}
            >
              {TRANSACTION_STATUS_LABEL[trade.status]}
            </span>
            <span className="text-[11px] text-gray-400 ml-auto">#{trade.id}</span>
          </div>

          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {title}
          </p>
          <p className="text-sm font-bold text-primary-600">
            {trade.price > 0 ? `${trade.price.toLocaleString()}원` : '무료 나눔'}
          </p>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="text-gray-400">판매</span>
            <span className="font-medium text-gray-700">{trade.sellerNickname}</span>
            <ChevronRight size={11} className="text-gray-300 mx-0.5" />
            <span className="text-gray-400">구매</span>
            <span className="font-medium text-gray-700">{trade.buyerNickname}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>시작 {formatKst(trade.createdAt, 'yyyy.MM.dd HH:mm')}</span>
            {trade.completedAt && (
              <span className="text-emerald-600">
                완료 {formatKst(trade.completedAt, 'yyyy.MM.dd HH:mm')}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}
