// 관리자 탈퇴 회원 — 라운드9: 서버 status=WITHDRAWN 필터
import { useNavigate } from 'react-router-dom'
import { UserX, ChevronLeft } from 'lucide-react'
import AdminUserListPanel from './components/AdminUserListPanel'
import { useAdminUsers } from '@/features/admin/hooks'
import { toPanelUser } from './lib/userAdapter'

export default function AdminWithdrawnUsersPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useAdminUsers({
    status: 'WITHDRAWN',
    page: 0,
    size: 100,
  })
  const withdrawnUsers = (data?.content ?? []).map(toPanelUser)

  return (
    <div className="pb-10">

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <UserX size={20} className="text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">탈퇴 회원</h1>
        </div>
        <span className="text-sm text-gray-400 ml-auto">총 {withdrawnUsers.length}명</span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-sm text-amber-700 font-medium">복구 가능 안내</p>
        <p className="text-xs text-amber-600 mt-0.5">
          탈퇴 회원은 복구 버튼으로 계정을 정상 상태로 되돌릴 수 있습니다.
          복구 후에도 기존 거래 내역과 포인트는 유지됩니다.
        </p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : withdrawnUsers.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <UserX size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">탈퇴 회원이 없습니다</p>
        </div>
      ) : (
        <AdminUserListPanel
          users={withdrawnUsers}
          showTabs={false}
          initialTab="WITHDRAWN"
        />
      )}
    </div>
  )
}
