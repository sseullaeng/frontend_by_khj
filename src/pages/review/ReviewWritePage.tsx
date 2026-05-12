// 리뷰 작성 — 가이드 §10.12
//
// 진입: /reviews/write 라우트, state: { transactionId, itemId, revieweeId }
// 백엔드 검증: 거래완료 7일 이내, 거래 참여자만, 같은 거래 본인 리뷰 1건

import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Star, ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useCreateReview } from '@/features/review/hooks'
import { useUserProfile } from '@/features/user/hooks'

interface ReviewRouteState {
  transactionId: number
  itemId: number | null     // 라운드13 PR #133 — 거래대행(EXTERNAL) 은 Item 미연결로 null
  revieweeId: number
}

export default function ReviewWritePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ReviewRouteState | null

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const { mutateAsync, isPending } = useCreateReview()
  const { data: reviewee } = useUserProfile(state?.revieweeId)

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-500 text-sm">잘못된 접근이에요.</p>
        <Link to="/reviews" className="text-primary-500 text-sm">
          ← 리뷰 관리로
        </Link>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    try {
      await mutateAsync({
        transactionId: state.transactionId,
        rating,
        comment: comment.trim() || undefined,
      })
      navigate('/reviews')
    } catch {
      // 토스트는 hook 에서
    }
  }

  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">리뷰 작성</h1>
      </div>

      {/* 대상 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
          {reviewee?.profileImage ? (
            <img src={reviewee.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">#</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {reviewee?.nickname ?? `사용자 #${state.revieweeId}`}
          </p>
          <p className="text-xs text-gray-400">
            거래 #{state.transactionId}{state.itemId != null && ` · 물품 #${state.itemId}`}
          </p>
        </div>
      </div>

      {/* 별점 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">거래는 어땠나요?</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
              aria-label={`${s}점`}
            >
              <Star
                size={32}
                className={
                  s <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-200'
                }
              />
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          {rating === 0 ? '별점을 선택해 주세요' : `${rating}점`}
        </p>
      </div>

      {/* 코멘트 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          후기 (선택)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="다른 사용자에게 도움이 될 후기를 남겨주세요"
          className="w-full h-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{comment.length} / 500</p>
      </div>

      <p className="text-xs text-gray-400 mb-4 px-2">
        리뷰는 거래완료 7일 이내에만 작성할 수 있고, 작성 후 수정할 수 없어요.
      </p>

      <Button
        type="button"
        fullWidth
        onClick={handleSubmit}
        isLoading={isPending}
        disabled={rating === 0}
      >
        리뷰 등록
      </Button>
    </div>
  )
}
