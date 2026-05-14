// 관리자 전체 회원 — 라운드9: 서버 쿼리 검색 (keyword)
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import AdminUserListPanel from './components/AdminUserListPanel'
import { useAdminUsers } from '@/features/admin/hooks'
import { toPanelUser } from './lib/userAdapter'
import type { AdminUserStatusBE } from '@/features/admin/types'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'

const STATUS_OPTIONS: { value: AdminUserStatusBE | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '상태 전체' },
  { value: 'ACTIVE', label: '정상' },
  { value: 'DORMANT', label: '휴면' },
  { value: 'SUSPENDED', label: '활동정지' },
  { value: 'BLOCKED', label: '영구차단' },
  { value: 'WITHDRAWN', label: '탈퇴' },
]

export default function AdminUserPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminUserStatusBE | 'ALL'>('ALL')

  // 백엔드 keyword 서버 쿼리
  const { data, isLoading } = useAdminUsers({
    keyword: query.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page: 0,
    size: 50,
  })
  const users = useMemo(() => (data?.content ?? []).map(toPanelUser), [data])
  const total = data?.totalElements ?? 0

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
          <Users size={20} className="text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">전체 회원</h1>
        </div>
        <span className="text-sm text-gray-400 ml-auto">총 {total}명</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '전체', value: total, cls: 'text-gray-900' },
          {
            label: '활동정지',
            value: users.filter((u) => u.status === 'SUSPENDED').length,
            cls: 'text-amber-600',
          },
          {
            label: '영구차단',
            value: users.filter((u) => u.status === 'BLOCKED').length,
            cls: 'text-red-600',
          },
          {
            label: '탈퇴',
            value: users.filter((u) => u.status === 'WITHDRAWN').length,
            cls: 'text-gray-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-center"
          >
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
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
        <SelectDropdown
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={STATUS_OPTIONS}
          className="sm:w-36"
          buttonClassName="w-full"
        />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <AdminUserListPanel users={users} />
      )}
    </div>
  )
}
