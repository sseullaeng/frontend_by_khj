// 사용자 프로필 페이지 — GET /api/v1/users/{id}/profile
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Flag, User } from 'lucide-react'
import { useUserProfile } from '@/features/user/hooks'
import { useAuthStore } from '@/features/auth/store'
import { fromNow } from '@/shared/lib/date'
import ReportModal from '@/shared/ui/ReportModal'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = Number(id)
  const currentUser = useAuthStore((s) => s.user)
  const isMe = currentUser?.id === userId

  const { data: profile, isLoading } = useUserProfile(userId)
  const [reportOpen, setReportOpen] = useState(false)

  if (isLoading) return <div className="py-20 text-center text-gray-400">불러오는 중...</div>
  if (!profile)
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 mb-3">사용자를 찾을 수 없어요.</p>
        <button onClick={() => navigate(-1)} className="text-primary-500 text-sm">
          ← 돌아가기
        </button>
      </div>
    )

  return (
    <div className="max-w-md mx-auto pb-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">사용자 프로필</h1>
        {!isMe && (
          <button
            onClick={() => setReportOpen(true)}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
          >
            <Flag size={13} /> 신고
          </button>
        )}
      </div>

      {/* 프로필 카드 */}
      <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={32} className="text-indigo-400" />
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-900">{profile.nickname}</h2>
        <p className="text-xs text-gray-400">가입 {fromNow(profile.createdAt)}</p>

        <div className="grid grid-cols-2 gap-3 w-full mt-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">신뢰 지수</p>
            <p className="text-base font-bold text-primary-500">
              {profile.trustScore != null ? profile.trustScore.toFixed(1) : '신규'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">받은 리뷰</p>
            <p className="text-base font-bold text-gray-900">{profile.reviewCount}건</p>
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      {reportOpen && (
        <ReportModal
          target={{ kind: 'user', userId }}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}
