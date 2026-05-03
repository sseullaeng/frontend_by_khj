// 관리자 전체 회원 관리 페이지 — 백엔드 hook 연동
// 검색은 클라이언트 필터 (백엔드 검색 파라미터 합의 시 서버 쿼리로 교체).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import AdminUserListPanel from './components/AdminUserListPanel'
import { useAdminUsers } from '@/features/admin/hooks'
import { toPanelUser } from './lib/userAdapter'

export default function AdminUserPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data, isLoading } = useAdminUsers({ page: 0, size: 200 })
  const users = useMemo(() => (data?.content ?? []).map(toPanelUser), [data])

  // 닉네임·이메일 검색
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, query])

  return (
    <div className="pb-10">

      {/* 뒤로가기 + 페이지 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">전체 회원</h1>
        </div>
        <span className="text-sm text-gray-400 ml-auto">총 {users.length}명</span>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '전체',     value: users.length,                                         cls: 'text-gray-900' },
          { label: '활동정지', value: users.filter((u) => u.status === 'SUSPENDED').length, cls: 'text-amber-600' },
          { label: '탈퇴',     value: users.filter((u) => u.status === 'WITHDRAWN').length, cls: 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="닉네임 또는 이메일 검색"
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 회원 목록 */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <AdminUserListPanel users={filtered} />
      )}
    </div>
  )
}
