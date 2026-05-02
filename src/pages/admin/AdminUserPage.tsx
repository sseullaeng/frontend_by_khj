// 관리자 회원 관리 페이지 (UC-42): 회원 검색·상태 조회·활동정지·탈퇴 처리
import { useState } from 'react'
import {
  Users, Search, ShieldOff, UserX, ShieldCheck,
  ChevronDown, X,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

// 회원 상태 타입
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'

// 회원 데이터 구조
interface AdminUser {
  id: number
  nickname: string
  email: string
  joinedAt: string       // 가입일 (YYYY-MM-DD)
  status: UserStatus
  trustScore: number
  tradeCount: number
  reportCount: number    // 신고 누적 횟수
}

// ─── 상수 ────────────────────────────────────────────────────────────────────

// 상태별 라벨·색상
const STATUS_MAP: Record<UserStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: '정상',     cls: 'bg-emerald-100 text-emerald-700' },
  SUSPENDED: { label: '활동정지', cls: 'bg-amber-100 text-amber-700' },
  WITHDRAWN: { label: '탈퇴',     cls: 'bg-gray-100 text-gray-500' },
}

// 더미 회원 데이터 (백엔드 연동 전 목업)
const MOCK_USERS: AdminUser[] = [
  { id: 1,  nickname: '테스트유저', email: 'test@sseulang.kr',  joinedAt: '2024-01-10', status: 'ACTIVE',    trustScore: 80, tradeCount: 12, reportCount: 0 },
  { id: 2,  nickname: '홍길동',     email: 'hong@example.com',  joinedAt: '2024-02-14', status: 'ACTIVE',    trustScore: 72, tradeCount: 7,  reportCount: 1 },
  { id: 3,  nickname: '김영희',     email: 'kim@example.com',   joinedAt: '2024-03-01', status: 'SUSPENDED', trustScore: 40, tradeCount: 3,  reportCount: 5 },
  { id: 4,  nickname: '이철수',     email: 'lee@example.com',   joinedAt: '2024-03-20', status: 'ACTIVE',    trustScore: 90, tradeCount: 25, reportCount: 0 },
  { id: 5,  nickname: '박민준',     email: 'park@example.com',  joinedAt: '2024-04-05', status: 'WITHDRAWN', trustScore: 0,  tradeCount: 2,  reportCount: 3 },
  { id: 6,  nickname: '최수진',     email: 'choi@example.com',  joinedAt: '2024-04-10', status: 'ACTIVE',    trustScore: 65, tradeCount: 9,  reportCount: 0 },
  { id: 7,  nickname: '정우성',     email: 'jung@example.com',  joinedAt: '2024-04-18', status: 'ACTIVE',    trustScore: 55, tradeCount: 4,  reportCount: 2 },
  { id: 8,  nickname: '강동원',     email: 'kang@example.com',  joinedAt: '2024-04-22', status: 'SUSPENDED', trustScore: 30, tradeCount: 1,  reportCount: 8 },
  { id: 9,  nickname: '손예진',     email: 'son@example.com',   joinedAt: '2024-04-25', status: 'ACTIVE',    trustScore: 95, tradeCount: 31, reportCount: 0 },
  { id: 10, nickname: '유재석',     email: 'yoo@example.com',   joinedAt: '2024-05-01', status: 'ACTIVE',    trustScore: 88, tradeCount: 18, reportCount: 0 },
  { id: 11, nickname: '신동엽',     email: 'shin@example.com',  joinedAt: '2024-05-02', status: 'WITHDRAWN', trustScore: 0,  tradeCount: 0,  reportCount: 1 },
]

// 상태 필터 탭 목록
const STATUS_FILTERS: { key: 'ALL' | UserStatus; label: string }[] = [
  { key: 'ALL',       label: '전체' },
  { key: 'ACTIVE',    label: '정상' },
  { key: 'SUSPENDED', label: '활동정지' },
  { key: 'WITHDRAWN', label: '탈퇴' },
]

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export default function AdminUserPage() {
  // 회원 목록 (활동정지·탈퇴 처리 결과 반영)
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)

  // 검색어·상태 필터
  const [query, setQuery]               = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL')
  const [filterOpen, setFilterOpen]     = useState(false)

  // 활동정지/복구 확인 모달 대상
  const [suspendTarget, setSuspendTarget]   = useState<AdminUser | null>(null)
  // 탈퇴 처리 확인 모달 대상
  const [withdrawTarget, setWithdrawTarget] = useState<AdminUser | null>(null)

  // 필터·검색 적용
  const filtered = users.filter((u) => {
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter
    const q = query.trim().toLowerCase()
    const matchQuery = !q || u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    return matchStatus && matchQuery
  })

  /** 활동정지 ↔ 복구 토글 확정 */
  const handleSuspendConfirm = () => {
    if (!suspendTarget) return
    const next: UserStatus = suspendTarget.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setUsers((prev) => prev.map((u) => u.id === suspendTarget.id ? { ...u, status: next } : u))
    setSuspendTarget(null)
  }

  /** 탈퇴 처리 확정 (되돌릴 수 없음) */
  const handleWithdrawConfirm = () => {
    if (!withdrawTarget) return
    setUsers((prev) =>
      prev.map((u) => u.id === withdrawTarget.id ? { ...u, status: 'WITHDRAWN', trustScore: 0 } : u)
    )
    setWithdrawTarget(null)
  }

  return (
    <div>

      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={20} className="text-gray-500" />
          <h1 className="text-xl font-bold text-gray-900">회원 관리</h1>
        </div>
        <p className="text-sm text-gray-500">
          전체 회원 목록을 조회하고 활동정지·탈퇴 처리를 합니다. (UC-42)
        </p>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '전체',     value: users.length,                                        cls: 'text-gray-900' },
          { label: '활동정지', value: users.filter((u) => u.status === 'SUSPENDED').length, cls: 'text-amber-600' },
          { label: '탈퇴',     value: users.filter((u) => u.status === 'WITHDRAWN').length, cls: 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 입력 + 상태 필터 드롭다운 */}
      <div className="flex gap-2 mb-4">
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

        {/* 상태 필터 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-300 bg-white whitespace-nowrap"
          >
            {STATUS_FILTERS.find((f) => f.key === statusFilter)?.label}
            <ChevronDown size={14} className={cn('transition-transform', filterOpen && 'rotate-180')} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden w-28">
              {STATUS_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(key); setFilterOpen(false) }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                    statusFilter === key ? 'font-semibold text-primary-600' : 'text-gray-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((user) => (
              <li key={user.id} className="px-5 py-4 flex items-center gap-4">

                {/* 프로필 아바타 */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 font-bold text-sm">{user.nickname[0]}</span>
                </div>

                {/* 회원 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 truncate">{user.nickname}</span>
                    <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium shrink-0', STATUS_MAP[user.status].cls)}>
                      {STATUS_MAP[user.status].label}
                    </span>
                    {user.reportCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500 shrink-0">
                        신고 {user.reportCount}건
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    가입 {user.joinedAt} · 거래 {user.tradeCount}건 · 신뢰 {user.trustScore}점
                  </p>
                </div>

                {/* 액션 버튼 (탈퇴 회원에게는 표시 안 함) */}
                {user.status !== 'WITHDRAWN' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {/* 활동정지 / 복구 토글 */}
                    <button
                      onClick={() => setSuspendTarget(user)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                        user.status === 'SUSPENDED'
                          ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                      )}
                    >
                      {user.status === 'SUSPENDED' ? (
                        <><ShieldCheck size={13} /> 복구</>
                      ) : (
                        <><ShieldOff size={13} /> 정지</>
                      )}
                    </button>

                    {/* 탈퇴 처리 */}
                    <button
                      onClick={() => setWithdrawTarget(user)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <UserX size={13} /> 탈퇴
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 활동정지 / 복구 확인 모달 ────────────────────────────────────────── */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              {suspendTarget.status === 'SUSPENDED' ? (
                <ShieldCheck size={20} className="text-emerald-500" />
              ) : (
                <ShieldOff size={20} className="text-amber-500" />
              )}
              <h3 className="text-base font-bold text-gray-900">
                {suspendTarget.status === 'SUSPENDED' ? '활동 복구' : '활동정지'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-semibold text-gray-900">{suspendTarget.nickname}</span> 님을{' '}
              {suspendTarget.status === 'SUSPENDED'
                ? '정상 상태로 복구하시겠습니까?'
                : '활동정지 처리하시겠습니까? 해당 회원은 서비스 이용이 제한됩니다.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSuspendTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleSuspendConfirm}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors',
                  suspendTarget.status === 'SUSPENDED'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {suspendTarget.status === 'SUSPENDED' ? '복구' : '정지'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 탈퇴 처리 확인 모달 ──────────────────────────────────────────────── */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <UserX size={20} className="text-red-500" />
              <h3 className="text-base font-bold text-gray-900">탈퇴 처리</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-gray-900">{withdrawTarget.nickname}</span> 님을 탈퇴 처리하시겠습니까?
            </p>
            <p className="text-xs text-red-500 mb-5">⚠ 탈퇴 처리는 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setWithdrawTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleWithdrawConfirm}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                탈퇴 처리
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
