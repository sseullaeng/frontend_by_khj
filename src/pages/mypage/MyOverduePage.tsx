// 마이페이지 — 연체 정보 (라운드14)
//
// URL: /mypage/overdue
//   - GET /users/me/overdue-debt 누적 채무 카드
//   - GET /users/me/overdue 진행/종료 record 카드 목록
//   - 카드 클릭 → 해당 거래대행 상세 (/escrow/list/{escrowApplicationId})
//
// 백엔드 phase/status 명세:
//   PHASE_1 (D+1)  안내 — 보증금 차감 시작
//   PHASE_2 (D+3)  차감 누적
//   PHASE_3 (D+7)  보증금 소진 → 누적 채무 발생
//   PHASE_4 (D+14) 계정 정지 + 법적 조치 단계 진입
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Gavel, Wallet } from 'lucide-react'
import { useMyOverdueDebt, useMyOverdueRecords } from '@/features/overdue/hooks'
import type {
  OverduePhase,
  OverdueRecord,
  OverdueStatus,
} from '@/features/overdue/types'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

export default function MyOverduePage() {
  const navigate = useNavigate()
  const { data: debt, isLoading: debtLoading } = useMyOverdueDebt()
  const { data: records, isLoading: recordsLoading } = useMyOverdueRecords()

  const list = records ?? []
  const totalDebt = debt?.totalDebt ?? 0
  const activeCount = debt?.activeRecordCount ?? 0
  const isLoading = debtLoading || recordsLoading

  return (
    <div className="max-w-md mx-auto w-full pb-12">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">연체 정보</h1>
      </div>

      <DebtCard totalDebt={totalDebt} activeCount={activeCount} />

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {list.map((r) => (
            <li key={r.id}>
              <OverdueRecordCard record={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── 채무 카드 (총괄) ─────────────────────────────────────────────────────
function DebtCard({ totalDebt, activeCount }: { totalDebt: number; activeCount: number }) {
  const hasDebt = totalDebt > 0 || activeCount > 0
  return (
    <section
      className={cn(
        'rounded-2xl p-5 border shadow-sm',
        hasDebt
          ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-600 text-white'
          : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={16} className={hasDebt ? 'opacity-90' : 'text-emerald-700'} />
        <span className={cn('text-sm', hasDebt ? 'opacity-90' : 'text-emerald-700')}>
          누적 연체 채무
        </span>
      </div>
      <p className="text-3xl font-bold mb-1 truncate">
        {totalDebt.toLocaleString()}
        <span className="text-base font-medium opacity-80 ml-1">원</span>
      </p>
      <p className={cn('text-xs', hasDebt ? 'opacity-80' : 'text-emerald-700/80')}>
        {hasDebt
          ? `진행 중 ${activeCount}건 — 보증금 소진 후 누적된 채무예요.`
          : '현재 연체 중인 건이 없어요.'}
      </p>
    </section>
  )
}

// ── 빈 상태 ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="mt-8 py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
      연체 기록이 없어요. 안전한 거래를 이용해 주셔서 감사해요.
    </div>
  )
}

// ── 개별 record 카드 ─────────────────────────────────────────────────────
function OverdueRecordCard({ record }: { record: OverdueRecord }) {
  const isActive = record.status === '진행중' || record.status === '법적조치중'
  return (
    <Link
      to={`/escrow/list/${record.escrowApplicationId}`}
      className={cn(
        'block rounded-2xl border p-4 transition-colors hover:bg-gray-50',
        isActive ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <PhaseBadge phase={record.phase} />
        <StatusBadge status={record.status} />
        {record.legalAction !== 'NONE' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
            <Gavel size={10} /> {record.legalAction}
          </span>
        )}
        <ChevronRight size={14} className="ml-auto text-gray-300" />
      </div>

      <dl className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
        <Field label="연체 일수" value={`${record.overdueDays}일`} highlight={record.overdueDays >= 7} />
        <Field label="남은 보증금" value={`${record.remainingDeposit.toLocaleString()}원`} />
        <Field label="차감된 보증금" value={`${record.depositForfeitedAmount.toLocaleString()}원`} />
        <Field
          label="누적 채무"
          value={`${record.extraDebtAmount.toLocaleString()}원`}
          highlight={record.extraDebtAmount > 0}
        />
      </dl>

      <p className="mt-3 text-[11px] text-gray-500">
        반납 기한 — {formatKst(record.rentalEndAt, 'yyyy.MM.dd HH:mm')}
      </p>
      {record.accountSuspendedAt && (
        <p className="mt-1 text-[11px] inline-flex items-center gap-1 text-red-600 font-medium">
          <AlertTriangle size={11} />
          {formatKst(record.accountSuspendedAt, 'yyyy.MM.dd')} 계정 정지 진입
        </p>
      )}
      {record.resolvedAt && (
        <p className="mt-1 text-[11px] text-gray-400">
          정산 종료 — {formatKst(record.resolvedAt, 'yyyy.MM.dd')}
          {record.resolutionNote ? ` · ${record.resolutionNote}` : ''}
        </p>
      )}
    </Link>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn('font-medium', highlight ? 'text-red-600' : 'text-gray-900')}>{value}</dd>
    </div>
  )
}

const PHASE_STYLE: Record<OverduePhase, { label: string; cls: string }> = {
  PHASE_1: { label: '1단계 · 안내',        cls: 'bg-yellow-100 text-yellow-800' },
  PHASE_2: { label: '2단계 · 차감 누적',   cls: 'bg-orange-100 text-orange-700' },
  PHASE_3: { label: '3단계 · 채무 발생',   cls: 'bg-red-100 text-red-700' },
  PHASE_4: { label: '4단계 · 계정 정지',   cls: 'bg-red-600 text-white' },
}
function PhaseBadge({ phase }: { phase: OverduePhase }) {
  const s = PHASE_STYLE[phase] ?? { label: phase, cls: 'bg-gray-100 text-gray-700' }
  return <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', s.cls)}>{s.label}</span>
}

const STATUS_STYLE: Record<OverdueStatus, string> = {
  '진행중':     'bg-red-100 text-red-700',
  '법적조치중': 'bg-rose-200 text-rose-800',
  '정산완료':   'bg-gray-100 text-gray-600',
  '종료':       'bg-gray-100 text-gray-500',
}
function StatusBadge({ status }: { status: OverdueStatus }) {
  return (
    <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded', STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  )
}
