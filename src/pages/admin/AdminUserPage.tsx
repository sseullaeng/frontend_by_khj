// 관리자 전체 회원 관리 페이지 (UC-42): 검색·상태 필터·활동정지(기간 선택)·탈퇴 처리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import AdminUserListPanel, {
  MOCK_ADMIN_USERS,
  type AdminUser,
} from './components/AdminUserListPanel'  // 공용 회원 목록 패널

export default function AdminUserPage() {
  const navigate = useNavigate()

  // 회원 목록 (목업 데이터)
  const [users] = useState<AdminUser[]>(MOCK_ADMIN_USERS)
  // 닉네임·이메일 검색어
  const [query, setQuery] = useState('')

  // 검색 필터 적용
  const filtered = users.filter(u => {
    const q = query.trim().toLowerCase()
    return !q || u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="pb-10">

      {/* 뒤로가기 버튼 + 페이지 제목 */}
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

      {/* 요약 카드 3개 (전체 / 활동정지 / 탈퇴) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '전체',     value: users.length,                                         cls: 'text-gray-900' },
          { label: '활동정지', value: users.filter(u => u.status === 'SUSPENDED').length,   cls: 'text-amber-600' },
          { label: '탈퇴',     value: users.filter(u => u.status === 'WITHDRAWN').length,   cls: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 닉네임·이메일 검색 입력창 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="닉네임 또는 이메일 검색"
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
        {/* 검색어 지우기 버튼 */}
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 회원 목록 패널 (탭 필터 + 정지/복구/탈퇴 기능 포함) */}
      <AdminUserListPanel users={filtered} />

    </div>
  )
}
