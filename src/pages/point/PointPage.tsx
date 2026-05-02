// 포인트 페이지 — 잔액 + 내역 + 충전/출금 진입
//
// 잔액: user.pointBalance (별도 endpoint 없음)
// 내역: GET /api/v1/users/me/point/history?type=&page=&size=

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store'
import { paymentApi } from '@/features/payment/api'
import { pointKeys } from '@/features/payment/keys'
import type { PointHistory, PointHistoryType } from '@/features/payment/types'
import { Card } from '@/shared/ui/Card'
import { fromNow } from '@/shared/lib/date'

const TYPE_FILTERS: { value: PointHistoryType | 'all'; label: string }[] = [
  { value: 'all',    label: '전체' },
  { value: '충전',   label: '충전' },
  { value: '결제',   label: '결제' },
  { value: '출금',   label: '출금' },
  { value: '판매정산', label: '판매정산' },
]

export default function PointPage() {
  const user = useAuthStore((s) => s.user)
  const balance = user?.pointBalance ?? 0
  const [filter, setFilter] = useState<PointHistoryType | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: pointKeys.history(filter === 'all' ? undefined : filter),
    queryFn: () =>
      paymentApi
        .getHistory({ type: filter === 'all' ? undefined : filter, page: 0, size: 20 })
        .then((r) => r.data),
  })
  const histories = data?.content ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">포인트</h1>

      <Card className="text-center py-6">
        <p className="text-sm text-gray-500 mb-1">현재 잔액</p>
        <p className="text-3xl font-bold text-primary-500">{balance.toLocaleString()}원</p>
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
  // 백엔드가 부호 포함하여 보냄 — 양수면 적립(녹색), 음수면 차감(기본)
  const isPlus = history.amount > 0
  const colorCls = isPlus ? 'text-emerald-600' : 'text-gray-900'
  // toLocaleString() 은 음수에 자동 '-' 붙임. 양수에만 '+' 명시
  const display = `${isPlus ? '+' : ''}${history.amount.toLocaleString()}원`

  return (
    <li className="py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600">
            {history.type}
          </span>
          <span className="text-xs text-gray-400">{fromNow(history.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 truncate">{history.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${colorCls}`}>{display}</p>
        <p className="text-xs text-gray-400">잔액 {history.balanceAfter.toLocaleString()}원</p>
      </div>
    </li>
  )
}
