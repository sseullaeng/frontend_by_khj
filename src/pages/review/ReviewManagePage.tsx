import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useReviewStore } from '@/features/review/store'
import { cn } from '@/shared/lib/cn'

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
  const { reviews } = useReviewStore()
  const [tab, setTab] = useState<'sent' | 'received'>('sent')

  const sentReviews = reviews.filter((r) => r.reviewerId === currentUser?.id)
  const receivedReviews = reviews.filter((r) => r.revieweeId === currentUser?.id)
  const displayed = tab === 'sent' ? sentReviews : receivedReviews

  return (
    <div className="pb-10">
      <h1 className="text-lg font-bold text-gray-900 mb-4">리뷰 관리</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setTab('sent')}
          className={cn(
            'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
            tab === 'sent'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          )}
        >
          내가 남긴 리뷰 {sentReviews.length > 0 && `(${sentReviews.length})`}
        </button>
        <button
          onClick={() => setTab('received')}
          className={cn(
            'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
            tab === 'received'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          )}
        >
          나에 대한 리뷰 {receivedReviews.length > 0 && `(${receivedReviews.length})`}
        </button>
      </div>

      {/* 리뷰 없음 */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <MessageSquare size={48} className="mb-4 opacity-30" />
          <p className="text-sm">
            {tab === 'sent' ? '아직 남긴 리뷰가 없어요' : '아직 받은 리뷰가 없어요'}
          </p>
          <p className="text-xs mt-1">
            {tab === 'sent' ? '거래 완료 후 상대방에게 리뷰를 남겨보세요' : '거래를 완료하면 리뷰를 받을 수 있어요'}
          </p>
        </div>
      )}

      {/* 리뷰 목록 */}
      {displayed.length > 0 && (
        <ul className="flex flex-col gap-3">
          {displayed.map((review) => (
            <li key={review.id} className="p-4 bg-white border border-gray-200 rounded-xl">
              {/* 상단: 상대방 + 별점 */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    {tab === 'sent' ? `→ ${review.revieweeNickname}` : `← 익명`}
                  </p>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {review.itemTitle}
                  </p>
                </div>
                <StarRow rating={review.rating} />
              </div>

              {/* 태그 */}
              {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-primary-50 text-primary-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 후기 */}
              {review.content && (
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                  {review.content}
                </p>
              )}

              {/* 날짜 */}
              <p className="text-xs text-gray-400 mt-2 text-right">
                {new Date(review.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
