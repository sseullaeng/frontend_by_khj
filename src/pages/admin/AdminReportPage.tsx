// 관리자 신고 처리 — 백엔드 실 연동 (라운드13 — 이전 mock 데이터 제거)
//
// Endpoints:
//   GET   /api/v1/admin/reports?status=&page=&size=
//   PATCH /api/v1/admin/reports/{id}  { action, memo? }
//     action: MARK_IN_PROGRESS | COMPLETE | REJECT
import { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Hash,
  Package,
  ShieldOff,
  Trash2,
  User,
  UserX,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useAdminReportDetail,
  useAdminReports,
  useAdminUserDetail,
  usePatchAdminReport,
  useSetUserBlocked,
  useSuspendUser,
  useWithdrawUser,
} from '@/features/admin/hooks'
import type { AdminReport, AdminReportStatus, AdminReportAction } from '@/features/admin/types'
import { useAdminDeleteItem } from '@/features/item/hooks'
import { Button } from '@/shared/ui/Button'
import { formatKst, fromNow } from '@/shared/lib/date'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'

const STATUS_TABS: { value: AdminReportStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '접수' },
  { value: 'IN_PROGRESS', label: '처리 중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'REJECTED', label: '반려' },
]

// 라운드14 — 백엔드가 응답 status 에 영어 alias 추가 + 한글 enum 도 혼재 가능.
//   프론트 enum 외 값이 와도 crash 안 나도록 fallback 처리.
type StatusBadge = { label: string; cls: string; icon: typeof Clock }
const STATUS_BADGE_BASE: Record<AdminReportStatus, StatusBadge> = {
  PENDING: { label: '접수', cls: 'text-amber-700 bg-amber-100', icon: Clock },
  IN_PROGRESS: { label: '처리 중', cls: 'text-blue-700 bg-blue-100', icon: AlertTriangle },
  COMPLETED: { label: '완료', cls: 'text-emerald-700 bg-emerald-100', icon: CheckCircle },
  REJECTED: { label: '반려', cls: 'text-gray-600 bg-gray-100', icon: XCircle },
}
// 한글 alias (구버전 응답 호환)
const STATUS_BADGE: Record<string, StatusBadge> = {
  ...STATUS_BADGE_BASE,
  접수: STATUS_BADGE_BASE.PENDING,
  대기: STATUS_BADGE_BASE.PENDING,
  처리중: STATUS_BADGE_BASE.IN_PROGRESS,
  '처리 중': STATUS_BADGE_BASE.IN_PROGRESS,
  처리완료: STATUS_BADGE_BASE.COMPLETED,
  완료: STATUS_BADGE_BASE.COMPLETED,
  반려: STATUS_BADGE_BASE.REJECTED,
}
const FALLBACK_BADGE: StatusBadge = {
  label: '알 수 없음',
  cls: 'text-gray-500 bg-gray-100',
  icon: AlertTriangle,
}

function normalizeReportStatus(status: string): AdminReportStatus | null {
  switch (status) {
    case 'PENDING':
    case '접수':
    case '대기':
      return 'PENDING'
    case 'IN_PROGRESS':
    case '처리중':
    case '처리 중':
      return 'IN_PROGRESS'
    case 'COMPLETED':
    case '처리완료':
    case '완료':
      return 'COMPLETED'
    case 'REJECTED':
    case '반려':
      return 'REJECTED'
    default:
      return null
  }
}

export default function AdminReportPage() {
  const [status, setStatus] = useState<AdminReportStatus | 'ALL'>('PENDING')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useAdminReports({
    status: status === 'ALL' ? undefined : status,
    page,
    size: 20,
  })

  const [actioningReport, setActioningReport] = useState<AdminReport | null>(null)

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">신고 처리</h1>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setStatus(t.value)
              setPage(0)
            }}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              status === t.value
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (data?.content.length ?? 0) === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <AlertTriangle size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">신고가 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data!.content.map((r) => (
            <ReportListItem
              key={r.id}
              report={r}
              onAction={() => setActioningReport(r)}
            />
          ))}
        </ul>
      )}

      {/* 페이징 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm text-gray-600">
          <button
            disabled={!data.hasPrevious}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5">
            {data.page + 1} / {data.totalPages}
          </span>
          <button
            disabled={!data.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {actioningReport && (
        <ReportActionModal report={actioningReport} onClose={() => setActioningReport(null)} />
      )}
    </div>
  )
}

function ReportListItem({ report: r, onAction }: { report: AdminReport; onAction: () => void }) {
  const reporterQ = useAdminUserDetail(r.reporterId)
  const reportedQ = useAdminUserDetail(r.reportedId)
  const reporterName = reporterQ.data?.nickname ?? `사용자 #${r.reporterId}`
  const reportedName = reportedQ.data?.nickname ?? `사용자 #${r.reportedId}`
  const badge = STATUS_BADGE[r.status as string] ?? FALLBACK_BADGE
  const Icon = badge.icon
  const normalized = normalizeReportStatus(r.status as string)
  const canAction = normalized === 'PENDING' || normalized === 'IN_PROGRESS'

  return (
    <li className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
              badge.cls
            )}
          >
            <Icon size={11} />
            {badge.label}
          </span>
          <span className="text-[11px] text-gray-400 inline-flex items-center gap-0.5">
            <Hash size={10} />
            {r.id}
          </span>
          <span className="text-[11px] text-gray-400">{fromNow(r.createdAt)}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">{r.reason}</p>
        {r.detail && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{r.detail}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <User size={11} /> 신고자{' '}
            <Link to={`/users/${r.reporterId}`} className="text-primary-600 hover:underline">
              {reporterName}
            </Link>
          </span>
          <span className="inline-flex items-center gap-1">
            <User size={11} /> 피신고자{' '}
            <Link to={`/users/${r.reportedId}`} className="text-primary-600 hover:underline">
              {reportedName}
            </Link>
          </span>
          {r.itemId != null && (
            <span className="inline-flex items-center gap-1">
              <Package size={11} />{' '}
              <Link to={`/items/${r.itemId}`} className="text-primary-600 hover:underline">
                물품 #{r.itemId}
              </Link>
            </span>
          )}
        </div>
        {r.processedAt && (
          <p className="text-[11px] text-gray-400 mt-2">
            처리: {formatKst(r.processedAt, 'yyyy.MM.dd HH:mm')}
            {r.adminId && ` (admin #${r.adminId})`}
            {r.adminMemo && ` — ${r.adminMemo}`}
          </p>
        )}
      </div>

      {canAction && (
        <div className="flex sm:flex-col gap-1.5 shrink-0">
          <Button size="sm" variant="outline" onClick={onAction}>
            처리
          </Button>
        </div>
      )}
    </li>
  )
}

// ─── 액션 모달 ──────────────────────────────────────────────────────────────

const ACTION_OPTIONS: {
  value: AdminReportAction
  label: string
  desc: string
  activeCls: string
}[] = [
  {
    value: 'MARK_IN_PROGRESS',
    label: '처리 중으로',
    desc: '검토 시작 — 추후 완료/반려 처리',
    activeCls: 'border-blue-500 bg-blue-50',
  },
  {
    value: 'COMPLETE',
    label: '완료 처리',
    desc: '신고 내용을 확인하고 조치했어요',
    activeCls: 'border-emerald-500 bg-emerald-50',
  },
  {
    value: 'REJECT',
    label: '반려',
    desc: '신고가 부적절하거나 근거 부족',
    activeCls: 'border-gray-500 bg-gray-50',
  },
]

type ReportSanction = 'NONE' | 'SUSPEND' | 'BLOCK' | 'WITHDRAW'
type ReportedItemAction = 'NONE' | 'DELETE'

const SANCTION_OPTIONS: {
  value: ReportSanction
  label: string
  desc: string
  icon: typeof AlertTriangle
  activeCls: string
}[] = [
  {
    value: 'NONE',
    label: '제재 없음',
    desc: '신고 상태만 완료로 변경',
    icon: CheckCircle,
    activeCls: 'border-gray-500 bg-gray-50',
  },
  {
    value: 'SUSPEND',
    label: '활동 정지',
    desc: '피신고자를 지정 기간 정지하고 refresh token을 폐기',
    icon: ShieldOff,
    activeCls: 'border-amber-500 bg-amber-50',
  },
  {
    value: 'BLOCK',
    label: '영구 차단',
    desc: '피신고자의 로그인을 차단하고 refresh token을 폐기',
    icon: Ban,
    activeCls: 'border-red-500 bg-red-50',
  },
  {
    value: 'WITHDRAW',
    label: '강제 탈퇴',
    desc: '피신고자를 soft-delete 처리하고 refresh token을 폐기',
    icon: UserX,
    activeCls: 'border-red-600 bg-red-50',
  },
]

const ITEM_ACTION_OPTIONS: {
  value: ReportedItemAction
  label: string
  desc: string
  icon: typeof Package
  activeCls: string
}[] = [
  {
    value: 'NONE',
    label: '물품 조치 없음',
    desc: '신고 상태만 처리하고 물품은 유지',
    icon: Package,
    activeCls: 'border-gray-500 bg-gray-50',
  },
  {
    value: 'DELETE',
    label: '신고 물품 강제 삭제',
    desc: '관리자 권한으로 물품을 soft-delete 처리하고 감사 추적은 유지',
    icon: Trash2,
    activeCls: 'border-red-500 bg-red-50',
  },
]

function ReportActionModal({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const { data: detail } = useAdminReportDetail(report.id)
  const current = detail ?? report
  const { data: reportedUser } = useAdminUserDetail(current.reportedId)
  const reportedName = reportedUser?.nickname ?? `사용자 #${current.reportedId}`
  const [action, setAction] = useState<AdminReportAction>('COMPLETE')
  const [memo, setMemo] = useState('')
  const [sanction, setSanction] = useState<ReportSanction>('NONE')
  const [itemAction, setItemAction] = useState<ReportedItemAction>('NONE')
  const [suspendDays, setSuspendDays] = useState(7)
  const [withdrawReason, setWithdrawReason] = useState('')
  const { mutateAsync, isPending } = usePatchAdminReport()
  const suspendMut = useSuspendUser()
  const blockMut = useSetUserBlocked()
  const withdrawMut = useWithdrawUser()
  const deleteItemMut = useAdminDeleteItem()

  // PENDING 일 때만 MARK_IN_PROGRESS 가능
  const normalizedStatus = normalizeReportStatus(current.status as string)
  const availableActions = ACTION_OPTIONS.filter((o) =>
    normalizedStatus === 'PENDING' ? true : o.value !== 'MARK_IN_PROGRESS'
  )
  const canSanction = action === 'COMPLETE'
  const hasReportedItem = current.itemId != null
  const isSanctioning =
    suspendMut.isPending || blockMut.isPending || withdrawMut.isPending || deleteItemMut.isPending

  const runSanction = async () => {
    if (!canSanction || sanction === 'NONE') return
    if (sanction === 'SUSPEND') {
      await suspendMut.mutateAsync({ id: current.reportedId, days: suspendDays })
      return
    }
    if (sanction === 'BLOCK') {
      await blockMut.mutateAsync({ id: current.reportedId, blocked: true })
      return
    }
    await withdrawMut.mutateAsync({
      id: current.reportedId,
      reason: withdrawReason.trim() || memo.trim() || `신고 #${current.id} 처리`,
    })
  }

  const runItemAction = async () => {
    if (!canSanction || itemAction === 'NONE' || current.itemId == null) return
    await deleteItemMut.mutateAsync(current.itemId)
  }

  const handleSubmit = async () => {
    try {
      await runSanction()
      await runItemAction()
      await mutateAsync({ id: current.id, body: { action, memo: memo.trim() || undefined } })
      onClose()
    } catch (err) {
      // 진단 로그 — action / report id 와 응답 에러 단계 확인
      console.error('admin report patch failed', { reportId: current.id, action, err })
      toast.error(err instanceof Error ? err.message : '처리에 실패했어요.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[calc(100vh-3rem)] shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-1">신고 #{current.id} 처리</h3>
          <p className="text-xs text-gray-500 mb-1 line-clamp-2">{current.reason}</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
            <span>피신고자 {reportedName}</span>
            {current.itemId != null && (
              <Link to={`/items/${current.itemId}`} className="text-primary-600 hover:underline">
                신고 물품 #{current.itemId}
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <p className="text-xs font-semibold text-gray-700 mb-2">처리 방식</p>
              <div className="flex flex-col gap-2">
                {availableActions.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setAction(o.value)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-colors',
                      action === o.value ? o.activeCls : 'border-gray-200 bg-white hover:bg-gray-50'
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900">{o.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {canSanction && (
              <section>
                <p className="text-xs font-semibold text-gray-700 mb-2">신고 물품 조치</p>
                {hasReportedItem ? (
                  <div className="flex flex-col gap-2">
                    {ITEM_ACTION_OPTIONS.map((o) => {
                      const Icon = o.icon
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setItemAction(o.value)}
                          className={cn(
                            'p-3 rounded-xl border-2 text-left transition-colors',
                            itemAction === o.value
                              ? o.activeCls
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          )}
                        >
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <Icon size={14} />
                            {o.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
                    이 신고에는 연결된 물품이 없습니다.
                  </div>
                )}
              </section>
            )}
          </div>

          {canSanction && (
            <section className="mt-6">
              <p className="text-xs font-semibold text-gray-700 mb-2">피신고자 제재</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {SANCTION_OPTIONS.map((o) => {
                  const Icon = o.icon
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setSanction(o.value)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-colors',
                        sanction === o.value
                          ? o.activeCls
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      )}
                    >
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Icon size={14} />
                        {o.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
                    </button>
                  )
                })}
              </div>

              {sanction === 'SUSPEND' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    정지 기간
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {sanction === 'WITHDRAW' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    강제 탈퇴 사유
                  </label>
                  <textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="다중 신고 누적 + 관리자 검토"
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                  />
                </div>
              )}
            </section>
          )}

          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            관리자 메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="처리 사유 / 내부 메모 (≤500)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isPending || isSanctioning}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
          >
            취소
          </button>
          <Button
            onClick={handleSubmit}
            isLoading={isPending || isSanctioning}
            disabled={sanction === 'SUSPEND' && (suspendDays < 1 || suspendDays > 365)}
            fullWidth
          >
            처리
          </Button>
        </div>
      </div>
    </div>
  )
}
