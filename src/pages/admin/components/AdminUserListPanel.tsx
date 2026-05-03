// 관리자 회원 목록 공용 패널 컴포넌트: 탭 필터·정지(기간 선택)·복구·탈퇴 처리 공통 UI
import { useState } from 'react'
import { ShieldOff, ShieldCheck, UserX } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import UserProfileFloat from '@/shared/ui/UserProfileFloat'  // 유저 프로필 플로팅 패널

// ─── 타입 ──────────────────────────────────────────────────────────────────

/** 회원 상태 */
export type AdminUserStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'WITHDRAWN'

/** 관리자 회원 정보 */
export interface AdminUser {
  id: number
  nickname: string
  email: string
  memberId: string
  signupPath: string
  joinedAt: string        // YYYY-MM-DD
  status: AdminUserStatus
  trustScore: number
  tradeCount: number
  reportCount: number
  suspendedAt?: string    // 정지 처리 날짜
  suspendDays?: number    // 정지 기간 (일)
}

// ─── 상수 ──────────────────────────────────────────────────────────────────

/** 상태별 뱃지 스타일 */
export const ADMIN_STATUS_CLS: Record<AdminUserStatus, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  DORMANT:   'bg-sky-100 text-sky-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
}

/** 상태별 한글 레이블 */
export const ADMIN_STATUS_LABEL: Record<AdminUserStatus, string> = {
  ACTIVE:    '정상',
  DORMANT:   '휴면',
  SUSPENDED: '활동정지',
  WITHDRAWN: '탈퇴',
}

/** 정지 기간 선택 옵션 (일) */
const SUSPEND_OPTIONS = [3, 7, 30, 100]

// ─── 컴포넌트 Props ────────────────────────────────────────────────────────

type UserTab = AdminUserStatus | 'ALL' | 'REPORTED'

interface AdminUserListPanelProps {
  /** 표시할 회원 목록 (부모에서 사전 필터링) */
  users: AdminUser[]
  /** 상태 필터 탭 표시 여부 (기본값: true) */
  showTabs?: boolean
  /** 초기 선택 탭 (기본값: 'ALL') */
  initialTab?: UserTab
}

// ─── 공용 회원 목록 패널 컴포넌트 ─────────────────────────────────────────

/** 관리자 회원 목록 공용 패널: 탭 필터 + 정지 기간 선택 + 복구/탈퇴 처리 */
export default function AdminUserListPanel({
  users,
  showTabs = true,
  initialTab = 'ALL',
}: AdminUserListPanelProps) {
  // 활성 탭 상태
  const [activeTab, setActiveTab]     = useState<UserTab>(initialTab)
  // 유저별 로컬 상태 오버라이드 (정지·복구·탈퇴 결과 반영)
  const [statuses, setStatuses]       = useState<Record<number, AdminUserStatus>>({})
  // 유저별 정지 정보 (처리 날짜·기간)
  const [suspendInfo, setSuspendInfo] = useState<Record<number, { date: string; days: number }>>({})
  // 확인 모달 대상
  const [confirm, setConfirm]         = useState<{
    userId: number; userName: string; action: 'suspend' | 'restore' | 'withdraw'
  } | null>(null)
  // 정지 기간 선택 (활동정지 모달 내 드롭다운)
  const [suspendDays, setSuspendDays] = useState<number>(7)
  // 프로필 플로팅 패널 표시 유저 ID
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  // 상태 필터 탭 목록
  const TABS: { key: UserTab; label: string }[] = [
    { key: 'ALL',       label: '전체' },
    { key: 'ACTIVE',    label: '정상' },
    { key: 'DORMANT',   label: '휴면' },
    { key: 'SUSPENDED', label: '활동정지' },
    { key: 'WITHDRAWN', label: '탈퇴' },
    { key: 'REPORTED',  label: '신고제재' },
  ]

  /** 유저의 실제 상태 (로컬 오버라이드 우선) */
  const getStatus = (user: AdminUser): AdminUserStatus =>
    statuses[user.id] ?? user.status

  /** 정지 정보 (로컬 저장 우선, 없으면 MOCK 원본 사용) */
  const getSuspendInfo = (user: AdminUser) =>
    suspendInfo[user.id] ??
    (user.suspendedAt ? { date: user.suspendedAt, days: user.suspendDays ?? 0 } : null)

  /** 탭 기준 필터링 */
  const filtered = users.filter(u => {
    const eff = getStatus(u)
    if (activeTab === 'ALL')      return true
    if (activeTab === 'REPORTED') return u.reportCount > 0
    return eff === activeTab
  })

  /** 확인 후 상태 변경 적용 */
  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.action === 'suspend') {
      // 활동정지 처리 및 정지 정보 저장
      setStatuses(prev => ({ ...prev, [confirm.userId]: 'SUSPENDED' }))
      const today = new Date().toISOString().slice(0, 10)
      setSuspendInfo(prev => ({ ...prev, [confirm.userId]: { date: today, days: suspendDays } }))
    } else if (confirm.action === 'restore') {
      // 복구 처리 — 정지 정보 삭제
      setStatuses(prev => ({ ...prev, [confirm.userId]: 'ACTIVE' }))
      setSuspendInfo(prev => { const n = { ...prev }; delete n[confirm.userId]; return n })
    } else {
      // 탈퇴 처리
      setStatuses(prev => ({ ...prev, [confirm.userId]: 'WITHDRAWN' }))
    }
    setConfirm(null)
    setSuspendDays(7)
  }

  return (
    <div>
      {/* 상태 필터 탭 바 */}
      {showTabs && (
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 회원 목록 카드 */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">해당 회원이 없습니다</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(user => {
              const effStatus  = getStatus(user)
              const si         = getSuspendInfo(user)
              const isSuspended = effStatus === 'SUSPENDED'
              const isWithdrawn = effStatus === 'WITHDRAWN'

              return (
                <li key={user.id} className="flex items-center px-5 py-4 gap-3">

                  {/* 왼쪽: 프로필 클릭 → 플로팅 패널 */}
                  <button
                    onClick={() => setProfileUserId(user.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                  >
                    {/* 이니셜 아바타 */}
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-indigo-600">{user.nickname[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* 닉네임 + 상태 뱃지 + 신고 건수 */}
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{user.nickname}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ADMIN_STATUS_CLS[effStatus])}>
                          {ADMIN_STATUS_LABEL[effStatus]}
                        </span>
                        {user.reportCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                            신고 {user.reportCount}건
                          </span>
                        )}
                      </div>
                      {/* 이메일 */}
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {/* 가입일·거래 수·신뢰점수 */}
                      <p className="text-xs text-gray-400">
                        가입 {user.joinedAt} · 거래 {user.tradeCount}건 · 신뢰 {user.trustScore}점
                      </p>
                      {/* 활동정지 처리 날짜·기간 */}
                      {isSuspended && si && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          {si.days}일 정지 · {si.date} 처리
                        </p>
                      )}
                    </div>
                  </button>

                  {/* 오른쪽: 액션 버튼 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isWithdrawn ? (
                      /* 탈퇴 회원 — 복구 버튼만 표시 */
                      <button
                        onClick={() => setConfirm({ userId: user.id, userName: user.nickname, action: 'restore' })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold transition-colors"
                      >
                        <ShieldCheck size={13} />
                        복구
                      </button>
                    ) : (
                      <>
                        {/* 정지 중 → 복구 / 정상·휴면 → 정지 */}
                        <button
                          onClick={() => setConfirm({
                            userId: user.id,
                            userName: user.nickname,
                            action: isSuspended ? 'restore' : 'suspend',
                          })}
                          className={cn(
                            'p-2 rounded-lg border transition-colors',
                            isSuspended
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              : 'border-amber-200 text-amber-500 hover:bg-amber-50'
                          )}
                          title={isSuspended ? '복구' : '활동정지'}
                        >
                          {isSuspended ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                        </button>
                        {/* 탈퇴 처리 */}
                        <button
                          onClick={() => setConfirm({ userId: user.id, userName: user.nickname, action: 'withdraw' })}
                          className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          title="탈퇴 처리"
                        >
                          <UserX size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 유저 프로필 플로팅 패널 */}
      {profileUserId !== null && (
        <UserProfileFloat userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      {/* ── 확인 모달 ─────────────────────────────────────────────────────── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            {/* 모달 제목 */}
            <div className="flex items-center gap-2 mb-2">
              {confirm.action === 'suspend'  && <ShieldOff   size={20} className="text-amber-500" />}
              {confirm.action === 'restore'  && <ShieldCheck size={20} className="text-emerald-500" />}
              {confirm.action === 'withdraw' && <UserX       size={20} className="text-red-500" />}
              <h3 className="text-base font-bold text-gray-900">
                {confirm.action === 'suspend'  ? '활동정지' :
                 confirm.action === 'restore'  ? '활동 복구' : '탈퇴 처리'}
              </h3>
            </div>
            {/* 확인 메시지 */}
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-gray-900">{confirm.userName}</span> 님을{' '}
              {confirm.action === 'suspend'  ? '활동정지 처리하시겠습니까?' :
               confirm.action === 'restore'  ? '복구하시겠습니까?' :
                                              '탈퇴 처리하시겠습니까?'}
            </p>
            {/* 정지 기간 선택 드롭다운 (활동정지 시에만 표시) */}
            {confirm.action === 'suspend' && (
              <div className="mt-3 mb-1">
                <label className="text-xs text-gray-500 mb-1 block">정지 기간</label>
                <select
                  value={suspendDays}
                  onChange={e => setSuspendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg outline-none focus:border-amber-400 bg-white"
                >
                  {SUSPEND_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </div>
            )}
            {/* 탈퇴 경고 */}
            {confirm.action === 'withdraw' && (
              <p className="text-xs text-red-500 mt-1 mb-1">⚠ 탈퇴 처리는 되돌릴 수 없습니다.</p>
            )}
            {/* 취소 / 확인 버튼 */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setConfirm(null); setSuspendDays(7) }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors',
                  confirm.action === 'withdraw' ? 'bg-red-500 hover:bg-red-600' :
                  confirm.action === 'restore'  ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                  'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {confirm.action === 'withdraw' ? '탈퇴' :
                 confirm.action === 'restore'  ? '복구' : '정지'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
