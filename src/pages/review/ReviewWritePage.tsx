import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Star, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useReviewStore } from '@/features/review/store'
import { Button } from '@/shared/ui/Button'

interface ReviewRouteState {
  roomId: number
  itemId: number
  itemTitle: string
  opponentId: number
  opponentNickname: string
}

const EVAL_TAGS = [
  '응답이 빠르고 친절해요',
  '약속 시간을 잘 지켜요',
  '상품 상태가 설명과 일치해요',
  '거래 방식이 깔끔해요',
  '재거래 의향이 있어요',
  '가격이 합리적이에요',
]

export default function ReviewWritePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ReviewRouteState | null
  const currentUser = useAuthStore((s) => s.user)
  const { addReview, hasReviewed } = useReviewStore()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [content, setContent] = useState('')

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-500 text-sm">잘못된 접근이에요.</p>
        <button onClick={() => navigate(-1)} className="text-primary-500 text-sm">← 돌아가기</button>
      </div>
    )
  }

  const alreadyReviewed = currentUser ? hasReviewed(state.roomId, currentUser.id) : false

  if (alreadyReviewed) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-700 font-semibold">이미 리뷰를 남기셨어요</p>
        <button onClick={() => navigate('/reviews')} className="text-primary-500 text-sm">리뷰 관리로 이동 →</button>
      </div>
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    if (!currentUser || rating === 0) return
    addReview({
      roomId: state.roomId,
      itemId: state.itemId,
      itemTitle: state.itemTitle,
      reviewerId: currentUser.id,
      revieweeId: state.opponentId,
      revieweeNickname: state.opponentNickname,
      rating,
      tags: selectedTags,
      content,
    })
    navigate('/reviews', { replace: true })
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">리뷰 남기기</h1>
      </div>

      {/* 거래 정보 */}
      <div className="p-4 bg-gray-50 rounded-xl mb-6">
        <p className="text-xs text-gray-400 mb-0.5">거래 상품</p>
        <p className="text-sm font-semibold text-gray-900">{state.itemTitle}</p>
        <p className="text-xs text-gray-500 mt-1">상대방: {state.opponentNickname}</p>
      </div>

      {/* 별점 */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-800 mb-3">거래 만족도</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={
                  (hoverRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-200'
                }
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {rating === 0 ? '' : ['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요'][rating]}
          </span>
        </div>
      </div>

      {/* 평가 태그 */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-800 mb-3">어떤 점이 좋았나요? <span className="text-gray-400 font-normal">(복수 선택)</span></p>
        <div className="flex flex-wrap gap-2">
          {EVAL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedTags.includes(tag) ? '✓ ' : ''}{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 후기 입력 */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-800 mb-2">후기 <span className="text-gray-400 font-normal">(선택)</span></p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="거래 경험을 자유롭게 적어주세요"
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{content.length}자</p>
      </div>

      {/* 제출 버튼 */}
      <Button
        fullWidth
        disabled={rating === 0}
        onClick={handleSubmit}
      >
        리뷰 남기기
      </Button>
    </div>
  )
}
