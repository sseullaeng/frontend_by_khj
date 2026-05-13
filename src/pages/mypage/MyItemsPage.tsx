// 내 거래 목록 페이지 — 거래(Transaction) 기반
//
// 탭: 전체 / 거래완료 / 판매중 / 대여제공(내가 빌려준) / 대여현황(내가 빌린)
// 백엔드는 role + status 단건 필터만 → buyer 전체 / seller 전체 두 번 호출 후 클라에서 분기.
//
// 완료된 거래도 상세 페이지(/trades/:id) 진입 가능.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingBag, ChevronLeft } from 'lucide-react'
import { useMyTransactions } from '@/features/trade/hooks'
import { useAuthStore } from '@/features/auth/store'
import type { Transaction, TransactionStatus } from '@/features/trade/types'
import { fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

type TabKey = 'ALL' | 'DONE' | 'SELLING' | 'RENTAL_OUT' | 'RENTAL_IN'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL',        label: '전체' },
  { key: 'DONE',       label: '거래완료' },
  { key: 'SELLING',    label: '판매중' },
  { key: 'RENTAL_OUT', label: '대여제공' },
  { key: 'RENTAL_IN',  label: '대여현황' },
]

const ACTIVE_STATUSES: TransactionStatus[] = ['채팅중', '예약', '인계완료']

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
  const currentUser = useAuthStore((s) => s.user)
  const myId = currentUser?.id ?? null
  const [tabKey, setTabKey] = useState<TabKey>('ALL')

  // buyer/seller 두 측면 전체 — 탭별 필터는 클라이언트에서
  const buyerQ  = useMyTransactions({ role: 'buyer' })
  const sellerQ = useMyTransactions({ role: 'seller' })
  const isLoading = buyerQ.isLoading || sellerQ.isLoading

  const buyerTxs  = buyerQ.data?.content  ?? []
  const sellerTxs = sellerQ.data?.content ?? []

  const transactions: Transaction[] = (() => {
    switch (tabKey) {
      case 'ALL': {
        const merged = [...buyerTxs, ...sellerTxs]
        return dedupeByCreatedDesc(merged)
      }
      case 'DONE': {
        const merged = [...buyerTxs, ...sellerTxs].filter((t) => t.status === '거래완료')
        return dedupeByCreatedDesc(merged)
      }
      case 'SELLING':
        return sortByCreatedDesc(sellerTxs.filter((t) => ACTIVE_STATUSES.includes(t.status)))
      case 'RENTAL_OUT':
        return sortByCreatedDesc(
          sellerTxs.filter((t) => t.tradeType === '대여' && ACTIVE_STATUSES.includes(t.status)),
        )
      case 'RENTAL_IN':
        return sortByCreatedDesc(
          buyerTxs.filter((t) => t.tradeType === '대여' && ACTIVE_STATUSES.includes(t.status)),
        )
    }
  })()

  const totalLabel = TABS.find((t) => t.key === tabKey)!.label

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
          <p className="text-gray-500">{totalLabel} 내역이 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} myId={myId} />
          ))}
        </ul>
      )}
    </div>
  )
}

function dedupeByCreatedDesc(list: Transaction[]): Transaction[] {
  const seen = new Set<number>()
  const out: Transaction[] = []
  for (const t of list) {
    if (seen.has(t.id)) continue
    seen.add(t.id)
    out.push(t)
  }
  return sortByCreatedDesc(out)
}

function sortByCreatedDesc(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function TransactionRow({ tx, myId }: { tx: Transaction; myId: number | null }) {
  const role: 'buyer' | 'seller' = myId != null && tx.sellerId === myId ? 'seller' : 'buyer'
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
