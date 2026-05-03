// 관리자 출금 처리 — 가이드 §11.6
import { useState } from 'react'
import { useAdminWithdrawals, usePatchAdminWithdrawal } from '@/features/admin/hooks'
import type {
  AdminWithdrawalAction,
} from '@/features/admin/types'
import type { Withdrawal, WithdrawalStatus } from '@/features/payment/types'
import { Button } from '@/shared/ui/Button'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_BADGE: Record<WithdrawalStatus, string> = {
  '신청':     'bg-yellow-100 text-yellow-700',
  '승인':     'bg-blue-100 text-blue-700',
  '완료':     'bg-emerald-100 text-emerald-700',
  '실패':     'bg-red-100 text-red-700',
  '취소':     'bg-gray-200 text-gray-600',
  '환불완료': 'bg-purple-100 text-purple-700',
}

const FILTERS: ('all' | WithdrawalStatus)[] = ['all', '신청', '승인', '완료', '취소']

export default function AdminWithdrawPage() {
  const [status, setStatus] = useState<WithdrawalStatus | 'all'>('all')
  const [page, setPage] = useState(0)
  const [target, setTarget] = useState<Withdrawal | null>(null)

  const { data, isLoading } = useAdminWithdrawals({
    status: status === 'all' ? undefined : status,
    page,
    size: 20,
  })
  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">출금 처리</h1>

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
            {s === 'all' ? '전체' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-400">출금 신청이 없어요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs">
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-right py-2 px-2">금액</th>
                <th className="text-left py-2 px-2">은행</th>
                <th className="text-left py-2 px-2">계좌번호</th>
                <th className="text-left py-2 px-2">예금주</th>
                <th className="text-center py-2 px-2">상태</th>
                <th className="text-left py-2 px-2">신청일</th>
                <th className="text-center py-2 px-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-500">#{w.id}</td>
                  <td className="py-2 px-2 text-right font-semibold">{w.amount.toLocaleString()}원</td>
                  <td className="py-2 px-2">{w.bankName}</td>
                  <td className="py-2 px-2 font-mono text-xs">{w.accountNumber}</td>
                  <td className="py-2 px-2">{w.accountHolder}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', STATUS_BADGE[w.status])}>
                      {w.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-500">{formatKst(w.createdAt, 'yyyy.MM.dd HH:mm')}</td>
                  <td className="py-2 px-2 text-center">
                    {(w.status === '신청' || w.status === '승인') && (
                      <button
                        onClick={() => setTarget(w)}
                        className="px-2 py-1 text-xs border border-primary-300 text-primary-600 rounded hover:bg-primary-50"
                      >
                        처리
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {target && <ProcessModal w={target} onClose={() => setTarget(null)} />}
    </div>
  )
}

function ProcessModal({ w, onClose }: { w: Withdrawal; onClose: () => void }) {
  const { mutateAsync, isPending } = usePatchAdminWithdrawal()
  const [action, setAction] = useState<AdminWithdrawalAction>(w.status === '신청' ? 'APPROVE' : 'COMPLETE')
  const [memo, setMemo] = useState('')

  const submit = async () => {
    try {
      await mutateAsync({ id: w.id, body: { action, memo: memo.trim() || undefined } })
      onClose()
    } catch {
      // hook 에서 토스트
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <h3 className="font-bold text-gray-900 mb-2">출금 #{w.id} 처리</h3>
        <p className="text-sm text-gray-500 mb-4">
          {w.amount.toLocaleString()}원 — {w.bankName} {w.accountNumber}
        </p>

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-sm font-medium text-gray-700">처리</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as AdminWithdrawalAction)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
          >
            {w.status === '신청' && (
              <>
                <option value="APPROVE">승인 (외부 이체 시작)</option>
                <option value="REJECT">거부 (잔액 자동 환불)</option>
              </>
            )}
            {w.status === '승인' && <option value="COMPLETE">완료 (이체 완료 표시)</option>}
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
