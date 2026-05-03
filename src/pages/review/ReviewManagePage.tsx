import { useState } from 'react'
import { Star, MessageSquare, PenLine, X, Check } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useReviewStore } from '@/features/review/store'
import type { Review } from '@/features/review/types'
import { cn } from '@/shared/lib/cn'

const EVAL_TAGS = [
  '응답이 빠르고 친절해요',
  '약속 시간을 잘 지켜요',
  '상품 상태가 설명과 일치해요',
  '거래 방식이 깔끔해요',
  '재거래 의향이 있어요',
  '가격이 합리적이에요',
]

/** 별점 표시 컴포넌트 */
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

/** 리뷰 수정 인라인 폼 */
function ReviewEditForm({
  review,
  onSave,
  onCancel,
}: {
  review: Review
  onSave: (data: Pick<Review, 'rating' | 'tags' | 'content'>) => void
  onCancel: () => void
}) {
  const [rating,       setRating]       = useState(review.rating)
  const [hoverRating,  setHoverRating]  = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>(review.tags)
  const [content,      setContent]      = useState(review.content)

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])

  return (
    <div className="space-y-4">
      {/* 별점 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">거래 만족도</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
              />
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요'][rating]}
          </span>
        </div>
      </div>

      {/* 평가 태그 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">평가 태그</p>
        <div className="flex flex-wrap gap-1.5">
          {EVAL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 후기 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1">후기</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="거래 경험을 자유롭게 적어주세요"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
        />
      </div>

      {/* 저장 / 취소 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <X size={14} />
          취소
        </button>
        <button
          onClick={() => onSave({ rating, tags: selectedTags, content })}
          disabled={rating === 0}
          className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Check size={14} />
          저장
        </button>
      </div>
    </div>
  )
}

export default function ReviewManagePage() {
  const currentUser = useAuthStore((s) => s.user)
  const { reviews, updateReview } = useReviewStore()
  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  // 현재 편집 중인 리뷰 ID (null이면 편집 없음)
  const [editingId, setEditingId] = useState<number | null>(null)

  const sentReviews     = reviews.filter((r) => r.reviewerId === currentUser?.id)
  const receivedReviews = reviews.filter((r) => r.revieweeId === currentUser?.id)
  const displayed       = tab === 'sent' ? sentReviews : receivedReviews

  /** 리뷰 수정 저장 */
  const handleSave = (id: number, data: Pick<Review, 'rating' | 'tags' | 'content'>) => {
    updateReview(id, data)
    setEditingId(null)
  }

  return (
    <div className="pb-10">
      <h1 className="text-lg font-bold text-gray-900 mb-4">리뷰 관리</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => { setTab('sent'); setEditingId(null) }}
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
          onClick={() => { setTab('received'); setEditingId(null) }}
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
              {editingId === review.id ? (
                /* ── 편집 모드 ── */
                <ReviewEditForm
                  review={review}
                  onSave={(data) => handleSave(review.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                /* ── 읽기 모드 ── */
                <>
                  {/* 상단: 상대방 + 별점 + 수정 버튼(내가 남긴 리뷰만) */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        {tab === 'sent' ? `→ ${review.revieweeNickname}` : `← 익명`}
                      </p>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {review.itemTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRow rating={review.rating} />
                      {/* 내가 남긴 리뷰만 수정 버튼 표시 */}
                      {tab === 'sent' && (
                        <button
                          onClick={() => setEditingId(review.id)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-primary-500 hover:border-primary-300 transition-colors"
                          title="수정"
                        >
                          <PenLine size={14} />
                        </button>
                      )}
                    </div>
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
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
