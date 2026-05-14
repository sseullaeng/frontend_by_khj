// 관리자 회원 목록 공용 패널 컴포넌트: 탭 필터·정지·영구차단·탈퇴 처리 공통 UI
import { useState } from 'react'
import { Ban, ShieldOff, ShieldCheck, UserX, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'
import { Button } from '@/shared/ui/Button'
import {
  useAdminUserDetail,
  useSetUserBlocked,
  useSuspendUser,
  useUnsuspendUser,
  useWithdrawUser,
} from '@/features/admin/hooks'
import { formatKst } from '@/shared/lib/date'

// ─── 타입 ──────────────────────────────────────────────────────────────────

/** 회원 상태 — 라운드14: BLOCKED(영구 차단) 추가 */
export type AdminUserStatus =
  | 'ACTIVE'
  | 'DORMANT'
  | 'SUSPENDED' // 시한부 정지, suspendedUntil 만료 후 자동 ACTIVE
  | 'BLOCKED' // 영구 차단
  | 'WITHDRAWN'

/** 관리자 회원 정보 */
export interface AdminUser {
  id: number
  nickname: string
  email: string
  memberId: string
  signupPath: string
  joinedAt: string // YYYY-MM-DD
  status: AdminUserStatus
  trustScore: number
  tradeCount: number
  reportCount: number
  suspendedAt?: string // 정지 처리 시각 (ISO)
  suspendDays?: number // 정지 기간 (일)
  suspendedUntil?: string // 라운드14 — 만료 시각 (백엔드 derived)
  pointBalance?: number
  lastLoginAt?: string | null
}

// ─── 상수 ──────────────────────────────────────────────────────────────────

/** 상태별 뱃지 스타일 */
const ADMIN_STATUS_CLS: Record<AdminUserStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DORMANT: 'bg-sky-100 text-sky-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  BLOCKED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
}

/** 상태별 한글 레이블 */
const ADMIN_STATUS_LABEL: Record<AdminUserStatus, string> = {
  ACTIVE: '정상',
  DORMANT: '휴면',
  SUSPENDED: '활동정지',
  BLOCKED: '영구차단',
  WITHDRAWN: '탈퇴',
}

/** 정지 기간 선택 옵션 (일) */
const SUSPEND_OPTIONS = [3, 7, 30, 100]
const SUSPEND_DROPDOWN_OPTIONS = SUSPEND_OPTIONS.map((days) => ({
  value: String(days),
  label: `${days}일`,
}))

// ─── 컴포넌트 Props ────────────────────────────────────────────────────────

type UserTab = AdminUserStatus | 'ALL' | 'REPORTED'
type UserAction = 'suspend' | 'unsuspend' | 'block' | 'unblock' | 'withdraw'

interface AdminUserListPanelProps {
  /** 표시할 회원 목록 (부모에서 사전 필터링) */
  users: AdminUser[]
  /** 상태 필터 탭 표시 여부 (기본값: true) */
  showTabs?: boolean
  /** 초기 선택 탭 (기본값: 'ALL') */
  initialTab?: UserTab
}

// ─── 공용 회원 목록 패널 컴포넌트 ─────────────────────────────────────────

/** 관리자 회원 목록 공용 패널: 탭 필터 + 정지 기간 선택 + 차단/탈퇴 처리 */
export default function AdminUserListPanel({
  users,
  showTabs = true,
  initialTab = 'ALL',
}: AdminUserListPanelProps) {
  // 활성 탭 상태
  const [activeTab, setActiveTab] = useState<UserTab>(initialTab)
  // 유저별 로컬 상태 오버라이드 (정지·차단·탈퇴 결과 반영)
  const [statuses, setStatuses] = useState<Record<number, AdminUserStatus>>({})
  // 유저별 정지 정보 (처리 날짜·기간)
  const [suspendInfo, setSuspendInfo] = useState<Record<number, { date: string; days: number }>>({})
  // 확인 모달 대상
  const [confirm, setConfirm] = useState<{
    userId: number
    userName: string
    action: UserAction
  } | null>(null)
  // 정지 기간 선택 (활동정지 모달 내 드롭다운)
  const [suspendDays, setSuspendDays] = useState<number>(7)
  const [withdrawReason, setWithdrawReason] = useState('')
  // 프로필 플로팅 패널 표시 유저 ID
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  // 상태 필터 탭 목록
  const TABS: { key: UserTab; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'ACTIVE', label: '정상' },
    { key: 'DORMANT', label: '휴면' },
    { key: 'SUSPENDED', label: '활동정지' },
    { key: 'BLOCKED', label: '영구차단' },
    { key: 'WITHDRAWN', label: '탈퇴' },
    { key: 'REPORTED', label: '신고제재' },
  ]

  /** 유저의 실제 상태 (로컬 오버라이드 우선) */
  const getStatus = (user: AdminUser): AdminUserStatus => statuses[user.id] ?? user.status

  /** 정지 정보 (로컬 저장 우선, 없으면 MOCK 원본 사용) */
  const getSuspendInfo = (user: AdminUser) =>
    suspendInfo[user.id] ??
    (user.suspendedAt ? { date: user.suspendedAt, days: user.suspendDays ?? 0 } : null)

  /** 탭 기준 필터링 */
  const filtered = users.filter((u) => {
    const eff = getStatus(u)
    if (activeTab === 'ALL') return true
    if (activeTab === 'REPORTED') return u.reportCount > 0
    return eff === activeTab
  })

  // 라운드14 — 시한부 정지 / 수동 해제 / 강제 탈퇴 각각 별도 endpoint
  const suspendMut = useSuspendUser()
  const unsuspendMut = useUnsuspendUser()
  const blockMut = useSetUserBlocked()
  const withdrawMut = useWithdrawUser()

  /** 확인 후 상태 변경 적용 — 백엔드 호출 + 로컬 캐시 반영 */
  const handleConfirm = () => {
    if (!confirm) return
    const userId = confirm.userId

    const finish = () => {
      setConfirm(null)
      setSuspendDays(7)
      setWithdrawReason('')
    }

    if (confirm.action === 'withdraw') {
      withdrawMut.mutate(
        { id: userId, reason: withdrawReason.trim() || undefined },
        {
          onSuccess: () => setStatuses((prev) => ({ ...prev, [userId]: 'WITHDRAWN' })),
          onError: () => toast.error('탈퇴 처리에 실패했어요.'),
          onSettled: finish,
        }
      )
      return
    }

    if (confirm.action === 'block' || confirm.action === 'unblock') {
      const blocked = confirm.action === 'block'
      blockMut.mutate(
        { id: userId, blocked },
        {
          onSuccess: () =>
            setStatuses((prev) => ({ ...prev, [userId]: blocked ? 'BLOCKED' : 'ACTIVE' })),
          onError: () =>
            toast.error(blocked ? '영구 차단에 실패했어요.' : '차단 해제에 실패했어요.'),
          onSettled: finish,
        }
      )
      return
    }

    if (confirm.action === 'suspend') {
      suspendMut.mutate(
        { id: userId, days: suspendDays },
        {
          onSuccess: () => {
            setStatuses((prev) => ({ ...prev, [userId]: 'SUSPENDED' }))
            const today = new Date().toISOString().slice(0, 10)
            setSuspendInfo((prev) => ({ ...prev, [userId]: { date: today, days: suspendDays } }))
          },
          onError: () => toast.error('활동 정지에 실패했어요.'),
          onSettled: finish,
        }
      )
      return
    }

    // unsuspend — 수동 정지 해제
    unsuspendMut.mutate(userId, {
      onSuccess: () => {
        setStatuses((prev) => ({ ...prev, [userId]: 'ACTIVE' }))
        setSuspendInfo((prev) => {
          const n = { ...prev }
          delete n[userId]
          return n
        })
      },
      onError: () => toast.error('정지 해제에 실패했어요.'),
      onSettled: finish,
    })
  }

  return (
    <div>
      {/* 상태 필터 탭 바 */}
      {showTabs && (
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {TABS.map((tab) => (
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
            {filtered.map((user) => {
              const effStatus = getStatus(user)
              const si = getSuspendInfo(user)
              const isSuspended = effStatus === 'SUSPENDED'
              const isBlocked = effStatus === 'BLOCKED'
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
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-medium',
                            ADMIN_STATUS_CLS[effStatus]
                          )}
                        >
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
                      {/* 활동정지 — 처리 날짜·기간 + 만료(suspendedUntil) */}
                      {isSuspended && si && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          {si.days}일 정지 · {si.date} 처리
                          {user.suspendedUntil && (
                            <span className="text-amber-500 ml-1">
                              (만료 {user.suspendedUntil.slice(0, 16).replace('T', ' ')})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* 오른쪽: 액션 버튼 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isWithdrawn ? (
                      <span className="text-xs text-gray-400 px-2">조치 완료</span>
                    ) : (
                      <>
                        {/* 정지 중 → 정지 해제 / 그 외 → 정지 */}
                        <button
                          onClick={() =>
                            setConfirm({
                              userId: user.id,
                              userName: user.nickname,
                              action: isSuspended ? 'unsuspend' : 'suspend',
                            })
                          }
                          disabled={isBlocked}
                          className={cn(
                            'p-2 rounded-lg border transition-colors',
                            isSuspended
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              : isBlocked
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-amber-200 text-amber-500 hover:bg-amber-50'
                          )}
                          title={isSuspended ? '정지 해제' : '활동정지'}
                        >
                          {isSuspended ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                        </button>
                        {/* 영구 차단 / 해제 */}
                        <button
                          onClick={() =>
                            setConfirm({
                              userId: user.id,
                              userName: user.nickname,
                              action: isBlocked ? 'unblock' : 'block',
                            })
                          }
                          className={cn(
                            'p-2 rounded-lg border transition-colors',
                            isBlocked
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              : 'border-red-200 text-red-500 hover:bg-red-50'
                          )}
                          title={isBlocked ? '차단 해제' : '영구 차단'}
                        >
                          {isBlocked ? <ShieldCheck size={14} /> : <Ban size={14} />}
                        </button>
                        {/* 탈퇴 처리 */}
                        <button
                          onClick={() =>
                            setConfirm({
                              userId: user.id,
                              userName: user.nickname,
                              action: 'withdraw',
                            })
                          }
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

      {/* 관리자 회원 단건 상세 */}
      {profileUserId !== null && (
        <AdminUserDetailModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      {/* ── 확인 모달 ─────────────────────────────────────────────────────── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            {/* 모달 제목 */}
            <div className="flex items-center gap-2 mb-2">
              {confirm.action === 'suspend' && <ShieldOff size={20} className="text-amber-500" />}
              {confirm.action === 'unsuspend' && (
                <ShieldCheck size={20} className="text-emerald-500" />
              )}
              {confirm.action === 'block' && <Ban size={20} className="text-red-500" />}
              {confirm.action === 'unblock' && (
                <ShieldCheck size={20} className="text-emerald-500" />
              )}
              {confirm.action === 'withdraw' && <UserX size={20} className="text-red-500" />}
              <h3 className="text-base font-bold text-gray-900">
                {confirm.action === 'suspend'
                  ? '활동정지'
                  : confirm.action === 'unsuspend'
                    ? '정지 해제'
                    : confirm.action === 'block'
                      ? '영구 차단'
                      : confirm.action === 'unblock'
                        ? '차단 해제'
                        : '탈퇴 처리'}
              </h3>
            </div>
            {/* 확인 메시지 */}
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-gray-900">{confirm.userName}</span> 님을{' '}
              {confirm.action === 'suspend'
                ? '활동정지 처리하시겠습니까?'
                : confirm.action === 'unsuspend'
                  ? '정지 해제하시겠습니까?'
                  : confirm.action === 'block'
                    ? '영구 차단하시겠습니까?'
                    : confirm.action === 'unblock'
                      ? '차단 해제하시겠습니까?'
                      : '탈퇴 처리하시겠습니까?'}
            </p>
            {/* 정지 기간 선택 드롭다운 (활동정지 시에만 표시) */}
            {confirm.action === 'suspend' && (
              <div className="mt-3 mb-1">
                <label className="text-xs text-gray-500 mb-1 block">정지 기간</label>
                <SelectDropdown
                  value={String(suspendDays)}
                  onChange={(value) => setSuspendDays(Number(value))}
                  options={SUSPEND_DROPDOWN_OPTIONS}
                  className="w-full"
                  buttonClassName="w-full border-amber-200 hover:border-amber-300 focus:ring-amber-100"
                  menuClassName="left-0 right-auto"
                />
              </div>
            )}
            {/* 탈퇴 사유 */}
            {confirm.action === 'withdraw' && (
              <div className="mt-3 mb-1">
                <label className="text-xs text-gray-500 mb-1 block">처리 사유 (선택)</label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="다중 신고 누적 + 관리자 검토"
                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg outline-none focus:border-red-400 resize-none"
                />
                <p className="text-xs text-red-500 mt-1 mb-1">탈퇴 처리는 되돌릴 수 없습니다.</p>
              </div>
            )}
            {/* 취소 / 확인 버튼 */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirm(null)
                  setSuspendDays(7)
                  setWithdrawReason('')
                }}
                fullWidth
                className="h-10 rounded-xl border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                variant={confirm.action === 'withdraw' || confirm.action === 'block' ? 'danger' : 'primary'}
                fullWidth
                className={cn(
                  'h-10 rounded-xl',
                  (confirm.action === 'unsuspend' || confirm.action === 'unblock') &&
                    'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700',
                  confirm.action === 'suspend' &&
                    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
                )}
              >
                {confirm.action === 'withdraw'
                  ? '탈퇴'
                  : confirm.action === 'unsuspend'
                    ? '해제'
                    : confirm.action === 'block'
                      ? '차단'
                      : confirm.action === 'unblock'
                        ? '해제'
                        : '정지'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminUserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data: user, isLoading } = useAdminUserDetail(userId)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-[28rem] bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <p className="text-sm font-semibold text-gray-800">관리자 회원 상세</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading || !user ? (
          <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <div className="overflow-y-auto px-5 py-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-indigo-600">{user.nickname[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{user.nickname}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span
                className={cn(
                  'ml-auto text-xs px-2 py-1 rounded-full font-medium',
                  ADMIN_STATUS_CLS[user.status]
                )}
              >
                {ADMIN_STATUS_LABEL[user.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <DetailStat
                label="신고"
                value={`${user.reportCount}건`}
                highlight={user.reportCount > 0}
              />
              <DetailStat label="거래" value={`${user.tradeCount}건`} />
              <DetailStat label="신뢰" value={`${user.trustScore ?? 0}점`} />
              <DetailStat label="포인트" value={`${user.pointBalance.toLocaleString()}원`} />
            </div>

            <dl className="text-sm divide-y divide-gray-100 border-y border-gray-100">
              <DetailRow label="회원 ID" value={`#${user.id}`} />
              <DetailRow label="가입" value={formatKst(user.createdAt, 'yyyy.MM.dd HH:mm')} />
              <DetailRow
                label="최근 로그인"
                value={
                  user.lastLoginAt ? formatKst(user.lastLoginAt, 'yyyy.MM.dd HH:mm') : '기록 없음'
                }
              />
              <DetailRow label="휴면 여부" value={user.dormant ? '휴면' : '아님'} />
              <DetailRow
                label="정지 시작"
                value={user.suspendedAt ? formatKst(user.suspendedAt, 'yyyy.MM.dd HH:mm') : '없음'}
              />
              <DetailRow
                label="정지 만료"
                value={
                  user.suspendedUntil ? formatKst(user.suspendedUntil, 'yyyy.MM.dd HH:mm') : '없음'
                }
              />
              <DetailRow
                label="정지 기간"
                value={user.suspendDays != null ? `${user.suspendDays}일` : '없음'}
              />
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
      )}
    >
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={cn('text-sm font-bold', highlight ? 'text-red-600' : 'text-gray-900')}>
        {value}
      </p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900 text-right break-all">{value}</dd>
    </div>
  )
}
