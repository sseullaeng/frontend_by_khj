// 내 거래 목록 페이지 — 거래(Transaction) 기반 (백엔드 spec 정합)
//
// 탭별로 role + status 필터로 GET /users/me/transactions 호출.
// 거래 응답에는 item title 이 없어 row 에서 itemId 만 표시 — 클릭 시 상세 페이지로.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingBag, ChevronLeft } from 'lucide-react'
import { useMyTransactions } from '@/features/trade/hooks'
import type { Transaction, TransactionRole, TransactionStatus } from '@/features/trade/types'
import { fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

type TabKey = 'BUYING' | 'BOUGHT' | 'SELLING' | 'SOLD'

const TABS: {
  key: TabKey
  label: string
  role: TransactionRole
  // 진행중 탭은 채팅중 + 예약 + 인계완료 (라운드 11) 묶음
  statuses: TransactionStatus[]
}[] = [
  { key: 'BUYING',  label: '구매중',   role: 'buyer',  statuses: ['채팅중', '예약', '인계완료'] },
  { key: 'BOUGHT',  label: '구매완료', role: 'buyer',  statuses: ['거래완료'] },
  { key: 'SELLING', label: '판매중',   role: 'seller', statuses: ['채팅중', '예약', '인계완료'] },
  { key: 'SOLD',    label: '판매완료', role: 'seller', statuses: ['거래완료'] },
]

const STATUS_BADGE: Record<TransactionStatus, { color: string }> = {
  '채팅중':   { color: 'bg-amber-100 text-amber-700' },
  '예약':     { color: 'bg-yellow-100 text-yellow-700' },
  '인계완료': { color: 'bg-indigo-100 text-indigo-700' },
  '거래완료': { color: 'bg-blue-100 text-blue-700' },
  '취소':     { color: 'bg-red-100 text-red-600' },
}

const TYPE_BADGE: Record<string, string> = {
  '판매': 'bg-blue-100 text-blue-700',
  '대여': 'bg-green-100 text-green-700',
  '나눔': 'bg-purple-100 text-purple-700',
}

export default function MyItemsPage() {
  const navigate = useNavigate()
  const [tabKey, setTabKey] = useState<TabKey>('BUYING')
  const tab = TABS.find((t) => t.key === tabKey)!

  // 단일 status 만 backend 가 받음 → 묶음 탭(진행중 = 채팅중·예약·인계완료) 은 N 번 호출 후 merge.
  // 훅 규칙상 호출 수는 고정 — 최대 3개 분기 + enabled 로 비활성.
  const q1 = useMyTransactions({ role: tab.role, status: tab.statuses[0] })
  const q2 = useMyTransactions(tab.statuses[1] ? { role: tab.role, status: tab.statuses[1] } : undefined)
  const q3 = useMyTransactions(tab.statuses[2] ? { role: tab.role, status: tab.statuses[2] } : undefined)

  const queries = [q1, ...(tab.statuses[1] ? [q2] : []), ...(tab.statuses[2] ? [q3] : [])]
  const isLoading = queries.some((q) => q.isLoading)
  const transactions: Transaction[] = queries
    .flatMap((q) => q.data?.content ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">내 거래</h1>
        <span className="text-sm text-gray-400 ml-auto">총 {transactions.length}건</span>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTabKey(t.key)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                tabKey === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">거래 내역을 불러오는 중...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{tab.label} 내역이 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} role={tab.role} />
          ))}
        </ul>
      )}
    </div>
  )
}

function TransactionRow({ tx, role }: { tx: Transaction; role: TransactionRole }) {
  const status = STATUS_BADGE[tx.status]
  const typeColor = TYPE_BADGE[tx.tradeType] ?? 'bg-gray-100 text-gray-700'
  const counterpartId = role === 'buyer' ? tx.sellerId : tx.buyerId

  return (
    <li>
      <Link
        to={`/trades/${tx.id}`}
        className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', status.color)}>
              {tx.status}
            </span>
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', typeColor)}>
              {tx.tradeType}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                role === 'buyer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
              )}
            >
              {role === 'buyer' ? '구매' : '판매'}
            </span>
          </div>

          <p className="font-medium text-gray-900 mb-1 text-sm">
            <Link to={`/items/${tx.itemId}`} className="hover:underline">
              물품 #{tx.itemId}
            </Link>
          </p>

          <p className="text-sm font-semibold text-gray-900 mb-1.5">
            {tx.tradeType === '나눔' ? '무료 나눔' : `${tx.price.toLocaleString()}원`}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              상대방{' '}
              <Link
                to={`/users/${counterpartId}`}
                className="text-gray-600 font-medium hover:underline"
              >
                #{counterpartId}
              </Link>
            </span>
            <span>{fromNow(tx.createdAt)}</span>
          </div>

          {tx.tradeType === '대여' && tx.rentalStart && tx.rentalEnd && (
            <p className="text-xs text-gray-500 mt-1">
              {tx.rentalStart.split('T')[0]} ~ {tx.rentalEnd.split('T')[0]}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
