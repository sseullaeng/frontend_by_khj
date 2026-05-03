// 관리자 신고 대기 처리 페이지: 유저/물품 신고 목록 조회·정지(기간 선택)·탈퇴 처리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, ShieldOff, ShieldCheck, UserX, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import UserProfileFloat from '@/shared/ui/UserProfileFloat'  // 유저 프로필 플로팅 패널

// ─── 타입 ──────────────────────────────────────────────────────────────────

/** 유저 상태 */
type UserStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'WITHDRAWN'

/** 신고 정보 */
interface AdminReport {
  id: number
  targetType: 'USER' | 'ITEM'    // 신고 대상 유형
  targetId: number               // 대상 유저 ID 또는 물품 ID
  targetName: string             // 닉네임 또는 물품 제목
  reason: string                 // 신고 사유
  reportCount: number            // 신고 누적 건수
  reportedAt: string             // 최근 신고일
  status: UserStatus             // 대상의 현재 상태
}

// ─── 상수 ──────────────────────────────────────────────────────────────────

/** 정지 기간 선택 옵션 (일) */
const SUSPEND_OPTIONS = [3, 7, 30, 100]

/** 상태별 뱃지 스타일 */
const STATUS_CLS: Record<UserStatus, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  DORMANT:   'bg-sky-100 text-sky-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
}

/** 상태별 한글 레이블 */
const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE:    '정상',
  DORMANT:   '휴면',
  SUSPENDED: '활동정지',
  WITHDRAWN: '탈퇴',
}

/** 신고 목업 데이터 */
const MOCK_REPORTS: AdminReport[] = [
  { id: 1, targetType: 'USER', targetId: 3,   targetName: '김영희',             reason: '사기 및 허위 거래',          reportCount: 5, reportedAt: '2026-05-01', status: 'SUSPENDED' },
  { id: 2, targetType: 'USER', targetId: 8,   targetName: '강동원',             reason: '욕설 및 비방',               reportCount: 8, reportedAt: '2026-04-30', status: 'SUSPENDED' },
  { id: 3, targetType: 'ITEM', targetId: 101, targetName: '불법 물품 판매',     reason: '불법 물품 거래',             reportCount: 3, reportedAt: '2026-05-02', status: 'ACTIVE' },
  { id: 4, targetType: 'USER', targetId: 5,   targetName: '박민준',             reason: '개인정보 요청',              reportCount: 3, reportedAt: '2026-04-29', status: 'WITHDRAWN' },
  { id: 5, targetType: 'ITEM', targetId: 102, targetName: '미성년자 대상 물품', reason: '음란물 / 불건전한 내용',     reportCount: 2, reportedAt: '2026-05-01', status: 'ACTIVE' },
  { id: 6, targetType: 'ITEM', targetId: 103, targetName: '허위 상품 설명',     reason: '사기 및 허위 거래',          reportCount: 4, reportedAt: '2026-04-28', status: 'ACTIVE' },
  { id: 7, targetType: 'USER', targetId: 2,   targetName: '홍길동',             reason: '스팸 / 반복 도배',           reportCount: 1, reportedAt: '2026-05-02', status: 'ACTIVE' },
]

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────

export default function AdminReportPage() {
  const navigate = useNavigate()

  // 신고 탭: 유저 / 물품
  const [tab, setTab]         = useState<'USER' | 'ITEM'>('USER')
  // 유저별 로컬 상태 오버라이드
  const [statuses, setStatuses]       = useState<Record<number, UserStatus>>({})
  // 유저별 정지 정보 (날짜·기간)
  const [suspendInfo, setSuspendInfo] = useState<Record<number, { date: string; days: number }>>({})
  // 확인 모달 대상
  const [confirm, setConfirm] = useState<{
    targetId: number; targetName: string; action: 'suspend' | 'withdraw'
  } | null>(null)
  // 정지 기간 선택
  const [suspendDays, setSuspendDays] = useState<number>(7)
  // 프로필 플로팅 패널 표시 유저 ID
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  // 처리 상태 드롭다운 필터 (전체/미처리/처리완료)
  const [processFilter, setProcessFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL')
  // 드롭다운 열림 여부
  const [processDropOpen, setProcessDropOpen] = useState(false)

  /** 대상의 실제 상태 (로컬 오버라이드 우선) */
  const getStatus = (report: AdminReport): UserStatus =>
    statuses[report.targetId] ?? report.status

  // 탭 필터 → 처리 상태 필터 순으로 적용
  const tabFiltered = MOCK_REPORTS.filter(r => r.targetType === tab)
  const filtered = tabFiltered.filter(r => {
    if (processFilter === 'PENDING') return getStatus(r) === 'ACTIVE'
    if (processFilter === 'DONE')    return getStatus(r) !== 'ACTIVE'
    return true
  })

  // 미처리(ACTIVE) 신고 건수
  const pendingCount = MOCK_REPORTS.filter(r => r.status === 'ACTIVE').length

  /** 확인 후 상태 변경 */
  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.action === 'suspend') {
      const cur = statuses[confirm.targetId] ?? (MOCK_REPORTS.find(r => r.targetId === confirm.targetId)?.status as UserStatus)
      const next = cur === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
      setStatuses(prev => ({ ...prev, [confirm.targetId]: next }))
      if (next === 'SUSPENDED') {
        const today = new Date().toISOString().slice(0, 10)
        setSuspendInfo(prev => ({ ...prev, [confirm.targetId]: { date: today, days: suspendDays } }))
      } else {
        setSuspendInfo(prev => { const n = { ...prev }; delete n[confirm.targetId]; return n })
      }
    } else {
      setStatuses(prev => ({ ...prev, [confirm.targetId]: 'WITHDRAWN' }))
    }
    setConfirm(null)
    setSuspendDays(7)
  }

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
          <AlertTriangle size={20} className="text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">신고 대기</h1>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto text-sm font-semibold text-red-500">
            미처리 {pendingCount}건
          </span>
        )}
      </div>

      {/* 요약 카드 (총 신고 / 미처리 / 처리완료) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '총 신고',   value: MOCK_REPORTS.length,                                              cls: 'text-gray-900' },
          { label: '미처리',    value: MOCK_REPORTS.filter(r => r.status === 'ACTIVE').length,           cls: 'text-red-500' },
          { label: '처리완료',  value: MOCK_REPORTS.filter(r => r.status !== 'ACTIVE').length,           cls: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 유저 / 물품 탭 */}
      <div className="flex border-b border-gray-200 mb-4">
        {(['USER', 'ITEM'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
              tab === t
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            {t === 'USER' ? `유저 신고 (${MOCK_REPORTS.filter(r => r.targetType === 'USER').length})` :
                            `물품 신고 (${MOCK_REPORTS.filter(r => r.targetType === 'ITEM').length})`}
          </button>
        ))}
      </div>

      {/* 처리 상태 드롭다운 필터 (우측 정렬) */}
      <div className="relative mb-4 flex justify-end">
        <button
          onClick={() => setProcessDropOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>
            {processFilter === 'ALL' ? '전체' : processFilter === 'PENDING' ? '미처리' : '처리완료'}
          </span>
          <ChevronDown size={14} className={cn('transition-transform', processDropOpen && 'rotate-180')} />
        </button>
        {processDropOpen && (
          <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
            {([['ALL', '전체'], ['PENDING', '미처리'], ['DONE', '처리완료']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setProcessFilter(key); setProcessDropOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  processFilter === key
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 신고 목록 */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">신고 없음</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filtered.map(report => {
              const status      = getStatus(report)
              const isWithdrawn = status === 'WITHDRAWN'
              const isSuspended = status === 'SUSPENDED'
              const si          = suspendInfo[report.targetId]

              return (
                <li key={report.id} className="flex items-center px-5 py-4 gap-3">
                  {tab === 'USER' ? (
                    /* ── 유저 신고: 좌(프로필 클릭) + 우(액션 버튼) ── */
                    <>
                      <button
                        onClick={() => setProfileUserId(report.targetId)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                      >
                        {/* 이니셜 아바타 */}
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-red-500">{report.targetName[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* 닉네임 + 상태 뱃지 */}
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{report.targetName}</span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STATUS_CLS[status])}>
                              {STATUS_LABEL[status]}
                            </span>
                          </div>
                          {/* 신고 사유 */}
                          <p className="text-xs text-gray-500">{report.reason}</p>
                          {/* 신고 건수 + 날짜 */}
                          <p className="text-xs text-gray-400">
                            신고 {report.reportCount}건 · {report.reportedAt}
                          </p>
                          {/* 정지 처리 정보 (정지 상태일 때만) */}
                          {isSuspended && si && (
                            <p className="text-xs text-amber-600 font-medium mt-0.5">
                              {si.days}일 정지 · {si.date} 처리
                            </p>
                          )}
                        </div>
                      </button>

                      {/* 액션 버튼 (탈퇴 회원은 비활성) */}
                      {!isWithdrawn && (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* 정지 ↔ 복구 토글 */}
                          <button
                            onClick={() => setConfirm({ targetId: report.targetId, targetName: report.targetName, action: 'suspend' })}
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
                            onClick={() => setConfirm({ targetId: report.targetId, targetName: report.targetName, action: 'withdraw' })}
                            className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            title="탈퇴 처리"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── 물품 신고: 전체 클릭 → 물품 상세 이동 ── */
                    <button
                      onClick={() => navigate(`/items/${report.targetId}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-lg">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{report.targetName}</p>
                        <p className="text-xs text-gray-500">{report.reason}</p>
                        <p className="text-xs text-gray-400">신고 {report.reportCount}건 · {report.reportedAt}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

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
              {confirm.action === 'suspend' ? (
                statuses[confirm.targetId] === 'SUSPENDED'
                  ? <ShieldCheck size={20} className="text-emerald-500" />
                  : <ShieldOff   size={20} className="text-amber-500" />
              ) : (
                <UserX size={20} className="text-red-500" />
              )}
              <h3 className="text-base font-bold text-gray-900">
                {confirm.action === 'suspend'
                  ? statuses[confirm.targetId] === 'SUSPENDED' ? '활동 복구' : '활동정지'
                  : '탈퇴 처리'}
              </h3>
            </div>
            {/* 확인 메시지 */}
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-gray-900">{confirm.targetName}</span> 님을{' '}
              {confirm.action === 'suspend'
                ? statuses[confirm.targetId] === 'SUSPENDED'
                  ? '복구하시겠습니까?'
                  : '활동정지 처리하시겠습니까?'
                : '탈퇴 처리하시겠습니까?'}
            </p>
            {/* 정지 기간 선택 드롭다운 (신규 정지 시에만) */}
            {confirm.action === 'suspend' && statuses[confirm.targetId] !== 'SUSPENDED' && (
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
                  confirm.action === 'withdraw'
                    ? 'bg-red-500 hover:bg-red-600'
                    : statuses[confirm.targetId] === 'SUSPENDED'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {confirm.action === 'withdraw'
                  ? '탈퇴'
                  : statuses[confirm.targetId] === 'SUSPENDED' ? '복구' : '정지'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
