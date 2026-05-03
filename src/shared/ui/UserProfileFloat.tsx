// 유저 프로필 플로팅 패널 — 백엔드 hook 연동
//
// 데이터 소스:
//   - 프로필: GET /api/v1/users/{id}/profile (useUserProfile)
//   - 리뷰:   GET /api/v1/reviews/users/{id} (useUserReviews) — 타인 조회 시 comment=null
//
// 미제공:
//   - 사용자가 등록한 물품 목록: 백엔드 sellerId 필터 미합의 → 빈 안내 (TODO)
//
// 닉네임만 표시 — 이메일 절대 노출 금지
import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useUserProfile } from '@/features/user/hooks'
import { useUserReviews } from '@/features/review/hooks'
import { formatKst } from '@/shared/lib/date'

interface Props {
  userId: number
  onClose: () => void
}

export default function UserProfileFloat({ userId, onClose }: Props) {
  const [tab, setTab] = useState<'items' | 'reviews'>('items')

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId)
  const { data: reviewsPage } = useUserReviews(userId, { page: 0, size: 20 })
  const reviews = reviewsPage?.content ?? []

  const trustScore = profile?.trustScore ?? 0
  const trustCls =
    trustScore >= 90 ? 'text-emerald-600' :
    trustScore >= 70 ? 'text-blue-600'    :
    'text-gray-500'

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 패널 */}
      <div className="relative z-10 w-full sm:w-96 bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <p className="text-sm font-semibold text-gray-800">회원 프로필</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto flex-1">

          {/* 프로필 요약 */}
          <div className="px-5 py-5 flex items-center gap-4 border-b border-gray-50">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt={profile.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {profile?.nickname?.[0] ?? '#'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">
                {profileLoading ? '불러오는 중...' : profile?.nickname ?? `유저 #${userId}`}
              </p>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn('text-sm font-semibold', trustCls)}>
                  신뢰도 {profile?.trustScore != null ? profile.trustScore.toFixed(1) : '—'}
                </span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-sm text-gray-500">리뷰 {profile?.reviewCount ?? 0}건</span>
              </div>

              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    trustScore >= 90 ? 'bg-emerald-400' :
                    trustScore >= 70 ? 'bg-blue-400'    :
                    'bg-gray-300'
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, trustScore))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setTab('items')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors border-b-2',
                tab === 'items'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              판매·대여 물품
            </button>
            <button
              onClick={() => setTab('reviews')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors border-b-2',
                tab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              리뷰 {reviews.length}개
            </button>
          </div>

          {/* 물품 목록 — TODO: 백엔드 ItemFilter.sellerId 합의 후 활성화 */}
          {tab === 'items' && (
            <div className="py-12 text-center text-sm text-gray-400 px-5">
              <p>판매자별 물품 목록은 곧 제공될 예정이에요.</p>
              <p className="text-xs text-gray-300 mt-1">백엔드 sellerId 필터 합의 대기 중</p>
            </div>
          )}

          {/* 리뷰 목록 */}
          {tab === 'reviews' && (
            <ul className="divide-y divide-gray-50">
              {reviews.length === 0 ? (
                <li className="py-10 text-center text-sm text-gray-400">아직 리뷰가 없어요</li>
              ) : (
                reviews.map((review) => (
                  <li key={review.id} className="px-5 py-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">
                        작성자 #{review.reviewerId}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatKst(review.createdAt, 'yyyy.MM.dd')}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}
                          fill={i < review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{review.rating}.0</span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {review.comment ?? <span className="text-gray-400 italic">내용 비공개</span>}
                    </p>
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
