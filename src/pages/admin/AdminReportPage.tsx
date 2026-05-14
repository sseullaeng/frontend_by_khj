// 관리자 신고 처리 — 백엔드 실 연동 (라운드13 — 이전 mock 데이터 제거)
//
// Endpoints:
//   GET   /api/v1/admin/reports?status=&page=&size=
//   PATCH /api/v1/admin/reports/{id}  { action, memo? }
//     action: MARK_IN_PROGRESS | COMPLETE | REJECT
import { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, XCircle, Hash, User, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminReports, usePatchAdminReport } from '@/features/admin/hooks'
import type { AdminReport, AdminReportStatus, AdminReportAction } from '@/features/admin/types'
import { Button } from '@/shared/ui/Button'
import { formatKst, fromNow } from '@/shared/lib/date'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'

const STATUS_TABS: { value: AdminReportStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: '전체' },
  { value: 'PENDING',     label: '대기' },
  { value: 'IN_PROGRESS', label: '처리 중' },
  { value: 'COMPLETED',   label: '완료' },
  { value: 'REJECTED',    label: '반려' },
]

const STATUS_BADGE: Record<AdminReportStatus, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING:     { label: '대기',    cls: 'text-amber-700 bg-amber-100',     icon: Clock },
  IN_PROGRESS: { label: '처리 중', cls: 'text-blue-700 bg-blue-100',       icon: AlertTriangle },
  COMPLETED:   { label: '완료',    cls: 'text-emerald-700 bg-emerald-100', icon: CheckCircle },
  REJECTED:    { label: '반려',    cls: 'text-gray-600 bg-gray-100',       icon: XCircle },
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
            onClick={() => { setStatus(t.value); setPage(0) }}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              status === t.value
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
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
          {data!.content.map((r) => {
            const badge = STATUS_BADGE[r.status]
            const Icon = badge.icon
            return (
              <li
                key={r.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full', badge.cls)}>
                      <Icon size={11} />
                      {badge.label}
                    </span>
                    <span className="text-[11px] text-gray-400 inline-flex items-center gap-0.5">
                      <Hash size={10} />{r.id}
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
                      <Link to={`/users/${r.reporterId}`} className="text-primary-600 hover:underline">#{r.reporterId}</Link>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User size={11} /> 피신고자{' '}
                      <Link to={`/users/${r.reportedId}`} className="text-primary-600 hover:underline">#{r.reportedId}</Link>
                    </span>
                    {r.itemId != null && (
                      <span className="inline-flex items-center gap-1">
                        <Package size={11} />{' '}
                        <Link to={`/items/${r.itemId}`} className="text-primary-600 hover:underline">물품 #{r.itemId}</Link>
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

                {/* 액션 */}
                {(r.status === 'PENDING' || r.status === 'IN_PROGRESS') && (
                  <div className="flex sm:flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setActioningReport(r)}>
                      처리
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
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
          <span className="px-3 py-1.5">{data.page + 1} / {data.totalPages}</span>
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

// ─── 액션 모달 ──────────────────────────────────────────────────────────────

const ACTION_OPTIONS: {
  value: AdminReportAction
  label: string
  desc: string
  activeCls: string
}[] = [
  { value: 'MARK_IN_PROGRESS', label: '처리 중으로',
    desc: '검토 시작 — 추후 완료/반려 처리',
    activeCls: 'border-blue-500 bg-blue-50' },
  { value: 'COMPLETE',         label: '완료 처리',
    desc: '신고 내용을 확인하고 조치했어요',
    activeCls: 'border-emerald-500 bg-emerald-50' },
  { value: 'REJECT',           label: '반려',
    desc: '신고가 부적절하거나 근거 부족',
    activeCls: 'border-gray-500 bg-gray-50' },
]

function ReportActionModal({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const [action, setAction] = useState<AdminReportAction>('COMPLETE')
  const [memo, setMemo] = useState('')
  const { mutateAsync, isPending } = usePatchAdminReport()

  // PENDING 일 때만 MARK_IN_PROGRESS 가능
  const availableActions = ACTION_OPTIONS.filter((o) =>
    report.status === 'PENDING' ? true : o.value !== 'MARK_IN_PROGRESS',
  )

  const handleSubmit = async () => {
    try {
      await mutateAsync({ id: report.id, body: { action, memo: memo.trim() || undefined } })
      onClose()
    } catch (err) {
      // 진단 로그 — action / report id 와 응답 에러 단계 확인
      console.error('admin report patch failed', { reportId: report.id, action, err })
      toast.error(err instanceof Error ? err.message : '처리에 실패했어요.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900 mb-1">신고 #{report.id} 처리</h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{report.reason}</p>

        <p className="text-xs font-semibold text-gray-700 mb-2">처리 방식</p>
        <div className="flex flex-col gap-2 mb-4">
          {availableActions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setAction(o.value)}
              className={cn(
                'p-3 rounded-xl border-2 text-left transition-colors',
                action === o.value ? o.activeCls : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
            >
              <p className="text-sm font-medium text-gray-900">{o.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold text-gray-700 mb-1.5">관리자 메모 (선택)</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="처리 사유 / 내부 메모 (≤500)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
          >
            취소
          </button>
          <Button onClick={handleSubmit} isLoading={isPending} fullWidth>
            처리
          </Button>
        </div>
      </div>
    </div>
  )
}
