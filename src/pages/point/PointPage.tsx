// 포인트 페이지 — 라운드 11 (Tx-Hold)
//
// 잔액: GET /api/v1/users/me/point  ⇒ { balance, holdAmount, totalBalance }
//   사용 가능 (balance)  + 거래 보관 중 (holdAmount)  = 총 잔액 (totalBalance)
// 내역: GET /api/v1/users/me/point/history?type=&page=&size=

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { paymentApi } from '@/features/payment/api'
import { usePointBalance } from '@/features/payment/hooks'
import { pointKeys } from '@/features/payment/keys'
import type { PointHistory, PointHistoryType } from '@/features/payment/types'
import { Card } from '@/shared/ui/Card'
import { fromNow } from '@/shared/lib/date'

const TYPE_FILTERS: { value: PointHistoryType | 'all'; label: string }[] = [
  { value: 'all',      label: '전체' },
  { value: '충전',     label: '충전' },
  { value: '거래보관', label: '거래보관' },
  { value: '거래환불', label: '거래환불' },
  { value: '보증금보관', label: '보증금보관' },
  { value: '보증금반환', label: '보증금반환' },
  { value: '보증금환불', label: '보증금환불' },
  { value: '보증금차감', label: '보증금차감' },
  { value: '판매정산', label: '판매정산' },
  { value: '결제',     label: '결제' },
  { value: '출금',     label: '출금' },
]

// 적립 vs 차감 — 부호 보강 표시 (라벨 색상 분기)
const PLUS_TYPES: PointHistoryType[] = [
  '충전',
  '거래환불',
  '보증금반환',
  '보증금환불',
  '판매정산',
  '환불',
  '배달정산',
]
const HISTORY_PAGE_SIZE = 50

export default function PointPage() {
  const { data: balanceData } = usePointBalance()
  const balance      = balanceData?.balance ?? 0
  const holdAmount   = balanceData?.holdAmount ?? 0
  const totalBalance = balanceData?.totalBalance ?? balance + holdAmount

  const [filter, setFilter] = useState<PointHistoryType | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: pointKeys.history(filter === 'all' ? undefined : filter, 0, HISTORY_PAGE_SIZE),
    queryFn: () =>
      paymentApi
        .getHistory({ type: filter === 'all' ? undefined : filter, page: 0, size: HISTORY_PAGE_SIZE })
        .then((r) => r.data),
  })
  const histories = data?.content ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">포인트</h1>

      {/* 잔액 카드 — 3분할 */}
      <Card className="py-5 px-5">
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 mb-1">총 잔액</p>
          <p className="text-3xl font-bold text-primary-500">
            {totalBalance.toLocaleString()}
            <span className="text-base font-medium text-gray-400 ml-1">P</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded-lg py-3 px-4">
            <p className="text-xs text-gray-500 mb-0.5">사용 가능</p>
            <p className="font-semibold text-gray-900">{balance.toLocaleString()}P</p>
          </div>
          <div className="bg-amber-50 rounded-lg py-3 px-4">
            <p className="text-xs text-amber-700 mb-0.5">거래 보관 중</p>
            <p className="font-semibold text-amber-900">{holdAmount.toLocaleString()}P</p>
          </div>
        </div>
        {holdAmount > 0 && (
          <p className="mt-2 text-[11px] text-gray-400 text-center">
            거래 보관 중인 금액은 인수 확인 또는 거래 취소 시 정산됩니다.
          </p>
        )}
      </Card>

      <div className="flex gap-2">
        <Link
          to="/point/charge"
          className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          충전하기
        </Link>
        <Link
          to="/point/withdraw"
          className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          출금하기
        </Link>
      </div>

      {/* 내역 */}
      <div className="mt-2">
        <h2 className="text-base font-semibold mb-2">이용 내역</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
        ) : histories.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">내역이 없어요.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {histories.map((h) => (
              <HistoryRow key={h.id} history={h} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function HistoryRow({ history }: { history: PointHistory }) {
  // 라벨 색: 적립 류는 emerald, 차감 류는 gray. (백엔드 amount 부호와 별개로 type 기반 라벨)
  const isPlusType = PLUS_TYPES.includes(history.type)
  const badgeCls = isPlusType
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-gray-100 text-gray-600'

  // 금액 색상은 amount 부호 기준 (스냅샷 정확)
  const amountCls = history.amount > 0 ? 'text-emerald-600' : 'text-gray-900'
  const display = `${history.amount > 0 ? '+' : ''}${history.amount.toLocaleString()}P`

  return (
    <li className="py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`px-1.5 py-0.5 rounded text-xs ${badgeCls}`}>
            {history.type}
          </span>
          <span className="text-xs text-gray-400">{fromNow(history.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 truncate">{history.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${amountCls}`}>{display}</p>
        <p className="text-xs text-gray-400">잔액 {history.balanceAfter.toLocaleString()}P</p>
      </div>
    </li>
  )
}
