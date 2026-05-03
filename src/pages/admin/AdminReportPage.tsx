// 관리자 신고 처리 — 가이드 §11.5
import { useState } from 'react'
import { useAdminReports, usePatchAdminReport } from '@/features/admin/hooks'
import type {
  AdminReport,
  AdminReportAction,
  AdminReportStatus,
} from '@/features/admin/types'
import { Button } from '@/shared/ui/Button'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_BADGE: Record<AdminReportStatus, string> = {
  PENDING:     'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-gray-200 text-gray-600',
}

const STATUS_LABEL: Record<AdminReportStatus, string> = {
  PENDING: '접수',
  IN_PROGRESS: '검토중',
  COMPLETED: '완료',
  REJECTED: '반려',
}

const FILTERS: ('all' | AdminReportStatus)[] = ['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']

export default function AdminReportPage() {
  const [status, setStatus] = useState<AdminReportStatus | 'all'>('all')
  const [page, setPage] = useState(0)
  const [target, setTarget] = useState<AdminReport | null>(null)

  const { data, isLoading } = useAdminReports({
    status: status === 'all' ? undefined : status,
    page,
    size: 20,
  })
  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">신고 처리</h1>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(0)
            }}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              status === s
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {s === 'all' ? '전체' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-400">신고가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="p-4 bg-white border border-gray-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', STATUS_BADGE[r.status])}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="text-xs text-gray-500">#{r.id}</span>
                    <span className="text-xs text-gray-400">{formatKst(r.createdAt, 'yyyy.MM.dd HH:mm')}</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    신고자 #{r.reporterId} → 대상 #{r.reportedId}
                    {r.itemId && <span className="text-gray-400"> · 물품 #{r.itemId}</span>}
                  </p>
                  <p className="text-sm font-medium mt-1">{r.reason}</p>
                  {r.detail && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{r.detail}</p>}
                  {r.adminMemo && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded p-2">
                      운영자 메모: {r.adminMemo}
                    </p>
                  )}
                </div>
                {r.status === 'PENDING' || r.status === 'IN_PROGRESS' ? (
                  <button
                    onClick={() => setTarget(r)}
                    className="shrink-0 px-3 py-1.5 text-xs border border-primary-300 text-primary-600 rounded hover:bg-primary-50"
                  >
                    처리
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50">
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">{page + 1} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasNext} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50">
            다음
          </button>
        </div>
      )}

      {target && <ProcessModal report={target} onClose={() => setTarget(null)} />}
    </div>
  )
}

function ProcessModal({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const { mutateAsync, isPending } = usePatchAdminReport()
  const [action, setAction] = useState<AdminReportAction>('MARK_IN_PROGRESS')
  const [memo, setMemo] = useState('')

  const submit = async () => {
    try {
      await mutateAsync({ id: report.id, body: { action, memo: memo.trim() || undefined } })
      onClose()
    } catch {
      // hook 에서 토스트
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <h3 className="font-bold text-gray-900 mb-2">신고 #{report.id} 처리</h3>
        <p className="text-sm text-gray-500 mb-4">{report.reason}</p>

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-sm font-medium text-gray-700">처리 방식</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as AdminReportAction)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
          >
            {report.status === 'PENDING' && <option value="MARK_IN_PROGRESS">검토 시작</option>}
            <option value="COMPLETE">처리 완료</option>
            <option value="REJECT">반려</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-sm font-medium text-gray-700">메모 (선택)</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={500}
            className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">
            취소
          </button>
          <Button onClick={submit} isLoading={isPending} className="flex-1">처리</Button>
        </div>
      </div>
    </div>
  )
}
