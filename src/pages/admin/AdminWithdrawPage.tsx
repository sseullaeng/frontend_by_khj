// 관리자 출금 처리 — §11.6
//
// Endpoints:
//   GET   /api/v1/admin/withdrawals?status=&page=&size=
//   PATCH /api/v1/admin/withdrawals/{id}  { action: APPROVE|REJECT|COMPLETE, memo? }
//
// 상태 흐름:
//   신청 ─APPROVE─▶ 승인 ─COMPLETE─▶ 완료
//      └─REJECT─▶ 거부 (잔액 자동 환불, atomic)
import { useState } from 'react'
import { Wallet, Hash, Clock, Building2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminWithdrawals, usePatchAdminWithdrawal } from '@/features/admin/hooks'
import type { Withdrawal, WithdrawalStatus } from '@/features/payment/types'
import type { AdminWithdrawalAction } from '@/features/admin/types'
import { Button } from '@/shared/ui/Button'
import { formatKst, fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_TABS: { value: WithdrawalStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: '신청', label: '신청' },
  { value: '승인', label: '승인' },
  { value: '완료', label: '완료' },
  { value: '거부', label: '거부' },
]

// 라운드14 — 백엔드가 영어 alias 추가 시 응답 status 가 한글/영어 혼재 가능.
//   매핑 외 값이 와도 crash 안 나도록 fallback.
type WithdrawBadge = { cls: string; icon: typeof Clock; label?: string }
const STATUS_BADGE_BASE: Record<'신청' | '승인' | '완료' | '거부', WithdrawBadge> = {
  신청: { cls: 'text-amber-700 bg-amber-100', icon: Clock },
  승인: { cls: 'text-blue-700 bg-blue-100', icon: AlertCircle },
  완료: { cls: 'text-emerald-700 bg-emerald-100', icon: CheckCircle },
  거부: { cls: 'text-red-700 bg-red-100', icon: XCircle },
}
// 영어 alias 호환 — 백엔드가 REQUESTED/APPROVED/... 같은 값을 보낼 때도 동일 뱃지
const STATUS_BADGE: Record<string, WithdrawBadge> = {
  ...STATUS_BADGE_BASE,
  REQUESTED: STATUS_BADGE_BASE.신청,
  PENDING: STATUS_BADGE_BASE.신청,
  APPROVED: STATUS_BADGE_BASE.승인,
  COMPLETED: STATUS_BADGE_BASE.완료,
  REJECTED: STATUS_BADGE_BASE.거부,
  FAILED: STATUS_BADGE_BASE.거부,
  CANCELLED: STATUS_BADGE_BASE.거부,
  CANCELED: STATUS_BADGE_BASE.거부,
  REFUNDED: STATUS_BADGE_BASE.거부,
  실패: STATUS_BADGE_BASE.거부,
  취소: STATUS_BADGE_BASE.거부,
  환불완료: STATUS_BADGE_BASE.거부,
}
const FALLBACK_BADGE: WithdrawBadge = {
  cls: 'text-gray-500 bg-gray-100',
  icon: AlertCircle,
  label: '알 수 없음',
}

// 마스킹: 가운데 영역을 ●로 — 끝 4자리만 노출
function maskAccount(num: string): string {
  const clean = num.replace(/[^0-9]/g, '')
  if (clean.length <= 4) return num
  const tail = clean.slice(-4)
  return `●●●●-${tail}`
}

type NormalizedWithdrawalStatus = '신청' | '승인' | '완료' | '거부'

function normalizeWithdrawalStatus(status: string): NormalizedWithdrawalStatus | null {
  switch (status) {
    case '신청':
    case 'REQUESTED':
    case 'PENDING':
      return '신청'
    case '승인':
    case 'APPROVED':
      return '승인'
    case '완료':
    case 'COMPLETED':
      return '완료'
    case '거부':
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
    case 'CANCELED':
    case 'REFUNDED':
    case '실패':
    case '취소':
    case '환불완료':
      return '거부'
    default:
      return null
  }
}

function requestedAtOf(w: Withdrawal): string | null {
  return w.requestedAt ?? w.createdAt ?? null
}

function processedAtOf(w: Withdrawal): string | null {
  return w.processedAt ?? (w.updatedAt && w.updatedAt !== w.createdAt ? w.updatedAt : null)
}

export default function AdminWithdrawPage() {
  const [status, setStatus] = useState<WithdrawalStatus | 'ALL'>('신청')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useAdminWithdrawals({
    status: status === 'ALL' ? undefined : status,
    page,
    size: 20,
  })

  const [actioning, setActioning] = useState<Withdrawal | null>(null)

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={20} className="text-primary-500" />
        <h1 className="text-xl font-bold text-gray-900">출금 관리</h1>
      </div>

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
          <Wallet size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">출금 신청이 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data!.content.map((w) => {
            const normalized = normalizeWithdrawalStatus(w.status as string)
            const badge =
              STATUS_BADGE[w.status as string] ??
              (normalized ? STATUS_BADGE_BASE[normalized] : FALLBACK_BADGE)
            const Icon = badge.icon
            const canAct = normalized === '신청' || normalized === '승인'
            const requestedAt = requestedAtOf(w)
            const processedAt = processedAtOf(w)
            return (
              <li
                key={w.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                        badge.cls
                      )}
                    >
                      <Icon size={11} />
                      {badge.label ?? normalized ?? w.status}
                    </span>
                    <span className="text-[11px] text-gray-400 inline-flex items-center gap-0.5">
                      <Hash size={10} />
                      {w.id}
                    </span>
                    {requestedAt && (
                      <span className="text-[11px] text-gray-400">신청 {fromNow(requestedAt)}</span>
                    )}
                  </div>

                  <p className="text-lg font-bold text-gray-900 mb-1">
                    {w.amount.toLocaleString()}원
                  </p>

                  {w.userId != null && (
                    <p className="text-xs text-gray-500 mb-0.5">신청자 #{w.userId}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                    <Building2 size={12} className="text-gray-400" />
                    <span className="font-medium">{w.bankName}</span>
                    <span className="text-gray-400">·</span>
                    <span className="font-mono tracking-tight">{maskAccount(w.accountNumber)}</span>
                    <span className="text-gray-400">·</span>
                    <span>{w.accountHolder}</span>
                  </div>

                  {processedAt && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      처리 {formatKst(processedAt, 'yyyy.MM.dd HH:mm')}
                      {w.adminId != null && ` (admin #${w.adminId})`}
                      {w.adminMemo && ` - ${w.adminMemo}`}
                    </p>
                  )}
                </div>

                {canAct && (
                  <div className="flex sm:flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setActioning(w)}>
                      처리
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

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

      {actioning && (
        <WithdrawActionModal withdrawal={actioning} onClose={() => setActioning(null)} />
      )}
    </div>
  )
}

// ─── 액션 모달 ──────────────────────────────────────────────────────────────

const ACTION_OPTIONS: {
  value: AdminWithdrawalAction
  label: string
  desc: string
  activeCls: string
  forStatus: NormalizedWithdrawalStatus[]
}[] = [
  {
    value: 'APPROVE',
    label: '승인',
    desc: '외부 이체 절차 시작 — 잔액은 신청 시점에 이미 차감됨',
    activeCls: 'border-blue-500 bg-blue-50',
    forStatus: ['신청'],
  },
  {
    value: 'REJECT',
    label: '거부',
    desc: '사기 의심 출금 차단 — 차감된 잔액 자동 환불',
    activeCls: 'border-red-500 bg-red-50',
    forStatus: ['신청'],
  },
  {
    value: 'COMPLETE',
    label: '이체 완료',
    desc: '외부 이체가 끝났음 — 출금 마감',
    activeCls: 'border-emerald-500 bg-emerald-50',
    forStatus: ['승인'],
  },
]

function WithdrawActionModal({
  withdrawal: w,
  onClose,
}: {
  withdrawal: Withdrawal
  onClose: () => void
}) {
  const normalizedStatus = normalizeWithdrawalStatus(w.status as string)
  const available = ACTION_OPTIONS.filter(
    (o) => normalizedStatus && o.forStatus.includes(normalizedStatus)
  )
  const [action, setAction] = useState<AdminWithdrawalAction>(available[0]?.value ?? 'APPROVE')
  const [memo, setMemo] = useState('')
  const { mutateAsync, isPending } = usePatchAdminWithdrawal()
  const requestedAt = requestedAtOf(w)

  const handleSubmit = async () => {
    try {
      await mutateAsync({ id: w.id, body: { action, memo: memo.trim() || undefined } })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '처리에 실패했어요.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900 mb-1">출금 #{w.id} 처리</h3>
        <p className="text-xs text-gray-500 mb-1">
          {w.amount.toLocaleString()}원 · {w.bankName} {maskAccount(w.accountNumber)} (
          {w.accountHolder})
        </p>
        {requestedAt && (
          <p className="text-[11px] text-gray-400 mb-4">
            신청 {formatKst(requestedAt, 'yyyy.MM.dd HH:mm')}
          </p>
        )}

        <p className="text-xs font-semibold text-gray-700 mb-2">처리 방식</p>
        <div className="flex flex-col gap-2 mb-4">
          {available.map((o) => (
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

        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          관리자 메모 (선택)
        </label>
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
