// 리뷰 관리 — 작성 대기 + 받은 리뷰 (가이드 §10.12)
//
// "내가 남긴 리뷰" 별도 endpoint 없음 — 백엔드는 reviewee 기준 페이징만 제공.
// 작성 대기와 받은 리뷰만 표시.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MessageSquare, Clock } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { usePendingReviews, useUserReviews } from '@/features/review/hooks'
import { cn } from '@/shared/lib/cn'
import { formatKst, fromNow } from '@/shared/lib/date'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}.0</span>
    </div>
  )
}

export default function ReviewManagePage() {
  const currentUser = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'pending' | 'received'>('pending')

  const pendingQ = usePendingReviews()
  const receivedQ = useUserReviews(currentUser?.id, { page: 0, size: 20 })

  const pendingItems = pendingQ.data?.content ?? []
  const receivedItems = receivedQ.data?.content ?? []

  return (
    <div className="pb-10">
      <h1 className="text-lg font-bold text-gray-900 mb-4">리뷰 관리</h1>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
            tab === 'pending'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-400 hover:text-gray-600',
          )}
        >
          작성 대기 {pendingItems.length > 0 && `(${pendingItems.length})`}
        </button>
        <button
          onClick={() => setTab('received')}
          className={cn(
            'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
            tab === 'received'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-400 hover:text-gray-600',
          )}
        >
          받은 리뷰 {receivedItems.length > 0 && `(${receivedItems.length})`}
        </button>
      </div>

      {tab === 'pending' && (
        <>
          {pendingItems.length === 0 ? (
            <EmptyState icon={<Clock />} text="작성할 리뷰가 없어요" />
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingItems.map((p) => (
                <li
                  key={p.transactionId}
                  className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {p.tradeType} · {p.tradeType === '나눔' ? '무료' : `${p.price.toLocaleString()}원`}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      <Link to={`/items/${p.itemId}`} className="hover:underline">
                        물품 #{p.itemId}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      마감 {formatKst(p.deadline, 'M.d HH:mm')} (~{fromNow(p.deadline)})
                    </p>
                  </div>
                  <Link
                    to="/reviews/write"
                    state={{
                      transactionId: p.transactionId,
                      itemId: p.itemId,
                      revieweeId: p.revieweeId,
                    }}
                    className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                  >
                    리뷰 작성
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'received' && (
        <>
          {receivedItems.length === 0 ? (
            <EmptyState icon={<MessageSquare />} text="아직 받은 리뷰가 없어요" />
          ) : (
            <ul className="flex flex-col gap-3">
              {receivedItems.map((review) => (
                <li
                  key={review.id}
                  className="p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">
                      거래 #{review.transactionId} · 상대방 #{review.reviewerId}
                    </p>
                    <StarRow rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    {formatKst(review.createdAt, 'yyyy.MM.dd')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="mb-4 opacity-30 [&>svg]:w-12 [&>svg]:h-12">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
