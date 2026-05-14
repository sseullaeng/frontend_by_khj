// 관리자 — 연체 record 상세 (라운드14)
//
// URL: /admin/overdue/:id
// 액션:
//   1) 법적조치 단계 갱신 — PATCH /admin/overdue/{id}/legal-action {legalAction, memo?}
//   2) 강제 종료(정산)     — PATCH /admin/overdue/{id}/resolve {note?}
//   3) 재계산              — POST  /admin/overdue/{id}/recompute
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Gavel,
  RefreshCcw,
  Wallet,
} from 'lucide-react'
import {
  useAdminOverdueDetail,
  useAdminOverduePatchLegalAction,
  useAdminOverdueRecompute,
  useAdminOverdueResolve,
} from '@/features/overdue/hooks'
import {
  LEGAL_ACTION_OPTIONS,
  PHASE_STYLE,
  STATUS_STYLE,
} from '@/features/overdue/labels'
import type {
  OverdueLegalAction,
  OverdueRecord,
} from '@/features/overdue/types'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

type ActionKey = 'legal' | 'resolve' | 'recompute'

export default function AdminOverdueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const recordId = Number(id)
  const navigate = useNavigate()

  const { data: record, isLoading } = useAdminOverdueDetail(recordId)
  const [action, setAction] = useState<ActionKey | null>(null)

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
  }
  if (!record) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">연체 기록을 찾을 수 없어요.</p>
        <button onClick={() => navigate('/admin/overdue')} className="text-primary-500 text-sm">
          목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="뒤로">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">연체 #{record.id}</h1>
        <Link
          to={`/admin/escrow/applications/${record.escrowApplicationId}`}
          className="ml-auto text-xs text-primary-500 inline-flex items-center gap-1 hover:underline"
        >
          거래대행 #{record.escrowApplicationId} <ExternalLink size={11} />
        </Link>
      </div>

      <HeaderBadges record={record} />
      <SummaryCard record={record} />
      <Timeline record={record} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
        <ActionButton
          icon={<Gavel size={14} />}
          label="법적 조치 단계"
          color="rose"
          onClick={() => setAction('legal')}
        />
        <ActionButton
          icon={<CheckCircle2 size={14} />}
          label="강제 종료(정산)"
          color="red"
          disabled={record.status === '정산완료' || record.status === '종료'}
          onClick={() => setAction('resolve')}
        />
        <ActionButton
          icon={<RefreshCcw size={14} />}
          label="재계산"
          color="primary"
          onClick={() => setAction('recompute')}
        />
      </div>

      {action === 'legal' && (
        <LegalActionModal record={record} onClose={() => setAction(null)} />
      )}
      {action === 'resolve' && (
        <ResolveModal record={record} onClose={() => setAction(null)} />
      )}
      {action === 'recompute' && (
        <RecomputeModal record={record} onClose={() => setAction(null)} />
      )}
    </div>
  )
}

// ── 뱃지 / 카드 ──────────────────────────────────────────────────────────
function HeaderBadges({ record }: { record: OverdueRecord }) {
  const phase = PHASE_STYLE[record.phase] ?? { label: record.phase, cls: 'bg-gray-100 text-gray-700' }
  return (
    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
      <span className={cn('text-[12px] font-semibold px-2 py-1 rounded', phase.cls)}>{phase.label}</span>
      <span className={cn('text-[12px] font-medium px-2 py-1 rounded', STATUS_STYLE[record.status] ?? 'bg-gray-100 text-gray-700')}>
        {record.status}
      </span>
      {record.legalAction !== 'NONE' && (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-rose-100 text-rose-700 px-2 py-1 rounded">
          <Gavel size={12} /> {record.legalAction}
        </span>
      )}
      <span className="text-[12px] text-gray-500 ml-auto">{record.overdueDays}일 경과</span>
    </div>
  )
}

function SummaryCard({ record }: { record: OverdueRecord }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-3">
      <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Wallet size={14} className="text-gray-500" /> 정산 요약
      </h2>
      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <Field label="보증금"        value={`${record.depositAmount.toLocaleString()}원`} />
        <Field label="차감된 보증금" value={`${record.depositForfeitedAmount.toLocaleString()}원`} />
        <Field label="남은 보증금"   value={`${record.remainingDeposit.toLocaleString()}원`} />
        <Field
          label="누적 채무"
          value={`${record.extraDebtAmount.toLocaleString()}원`}
          highlight={record.extraDebtAmount > 0}
        />
        <Field label="구매자 ID" value={`#${record.buyerId}`} />
        <Field label="판매자 ID" value={`#${record.sellerId}`} />
      </dl>
    </section>
  )
}

function Timeline({ record }: { record: OverdueRecord }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">진행 이력</h2>
      <dl className="divide-y divide-gray-100 text-sm">
        <TimelineRow label="반납 기한"      value={formatKst(record.rentalEndAt, 'yyyy.MM.dd HH:mm')} />
        <TimelineRow label="연체 시작"      value={formatKst(record.overdueStartedAt, 'yyyy.MM.dd HH:mm')} />
        <TimelineRow
          label="계정 자동 정지"
          value={record.accountSuspendedAt ? formatKst(record.accountSuspendedAt, 'yyyy.MM.dd HH:mm') : '—'}
          danger={!!record.accountSuspendedAt}
        />
        <TimelineRow
          label="정산 종료"
          value={record.resolvedAt ? formatKst(record.resolvedAt, 'yyyy.MM.dd HH:mm') : '—'}
        />
        {record.resolutionNote && (
          <TimelineRow label="처리 메모" value={record.resolutionNote} />
        )}
        <TimelineRow label="레코드 생성" value={formatKst(record.createdAt, 'yyyy.MM.dd HH:mm')} />
        <TimelineRow label="최근 갱신"   value={formatKst(record.updatedAt, 'yyyy.MM.dd HH:mm')} />
      </dl>
    </section>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn('font-semibold', highlight ? 'text-red-600' : 'text-gray-900')}>{value}</dd>
    </div>
  )
}

function TimelineRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={cn('text-right break-all', danger ? 'text-red-600 font-semibold' : 'text-gray-900')}>{value}</dd>
    </div>
  )
}

// ── 액션 버튼 ────────────────────────────────────────────────────────────
type ActionColor = 'primary' | 'red' | 'rose'
function ActionButton({
  icon, label, onClick, color, disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: ActionColor
  disabled?: boolean
}) {
  const colorCls: Record<ActionColor, string> = {
    primary: 'border-primary-200 text-primary-600 hover:bg-primary-50',
    red:     'border-red-200 text-red-600 hover:bg-red-50',
    rose:    'border-rose-200 text-rose-600 hover:bg-rose-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border bg-white text-sm font-medium transition-colors',
        colorCls[color],
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {icon} {label}
    </button>
  )
}

// ── 1) 법적 조치 단계 모달 ───────────────────────────────────────────────
function LegalActionModal({
  record, onClose,
}: { record: OverdueRecord; onClose: () => void }) {
  const [legal, setLegal] = useState<OverdueLegalAction>(record.legalAction)
  const [memo, setMemo] = useState('')
  const mut = useAdminOverduePatchLegalAction()

  const handleSubmit = () => {
    mut.mutate(
      { id: record.id, body: { legalAction: legal, memo: memo.trim() || undefined } },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title="법적 조치 단계" icon={<Gavel size={18} className="text-rose-500" />} onClose={onClose}>
      <label className="block text-xs text-gray-500 mb-1">단계</label>
      <select
        value={legal}
        onChange={(e) => setLegal(e.target.value as OverdueLegalAction)}
        className="w-full px-3 py-2 text-sm border border-rose-200 rounded-lg outline-none focus:border-rose-400 bg-white mb-3"
      >
        {LEGAL_ACTION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <label className="block text-xs text-gray-500 mb-1">메모 (선택)</label>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="예: 14일 경과 + 회수 의사 무응답, 내용증명 발송 결정"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-rose-400 resize-none mb-4"
      />

      <ModalActions
        onClose={onClose}
        onSubmit={handleSubmit}
        isLoading={mut.isPending}
        confirmLabel="조치 갱신"
        confirmCls="bg-rose-500 hover:bg-rose-600"
      />
    </Modal>
  )
}

// ── 2) 강제 종료(정산) 모달 ──────────────────────────────────────────────
function ResolveModal({
  record, onClose,
}: { record: OverdueRecord; onClose: () => void }) {
  const [note, setNote] = useState('')
  const mut = useAdminOverdueResolve()

  const handleSubmit = () => {
    mut.mutate(
      { id: record.id, body: note.trim() ? { note: note.trim() } : undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title="강제 종료(정산)" icon={<CheckCircle2 size={18} className="text-red-500" />} onClose={onClose}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs text-red-700 leading-relaxed">
        <p className="flex items-center gap-1 font-semibold mb-1">
          <AlertTriangle size={12} /> 되돌릴 수 없는 작업이에요
        </p>
        <p>
          이 record 의 진행 상태가 종료되고, 보증금 차감/누적 채무 갱신이 중단돼요.
          미회수 채무는 별도 회수 절차로 진행됩니다.
        </p>
      </div>

      <label className="block text-xs text-gray-500 mb-1">처리 메모 (선택)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="예: 분쟁조정 합의 — 잔여 채무 면제"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 resize-none mb-4"
      />

      <ModalActions
        onClose={onClose}
        onSubmit={handleSubmit}
        isLoading={mut.isPending}
        confirmLabel="강제 종료"
        confirmCls="bg-red-500 hover:bg-red-600"
      />
    </Modal>
  )
}

// ── 3) 재계산 모달 ───────────────────────────────────────────────────────
function RecomputeModal({
  record, onClose,
}: { record: OverdueRecord; onClose: () => void }) {
  const mut = useAdminOverdueRecompute()
  const handleSubmit = () => {
    mut.mutate(record.id, { onSuccess: onClose })
  }
  return (
    <Modal title="재계산" icon={<RefreshCcw size={18} className="text-primary-500" />} onClose={onClose}>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        반납 완료/취소 등 외부 사유로 record 가 동기화되지 않은 경우 호출해요.
        백엔드가 현재 상태 기준으로 phase / 차감액 / 채무를 다시 계산합니다.
      </p>
      <ModalActions
        onClose={onClose}
        onSubmit={handleSubmit}
        isLoading={mut.isPending}
        confirmLabel="재계산"
        confirmCls="bg-primary-500 hover:bg-primary-600"
      />
    </Modal>
  )
}

// ── 모달 공용 ────────────────────────────────────────────────────────────
function Modal({
  title, icon, onClose, children,
}: {
  title: string
  icon: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalActions({
  onClose, onSubmit, isLoading, confirmLabel, confirmCls,
}: {
  onClose: () => void
  onSubmit: () => void
  isLoading: boolean
  confirmLabel: string
  confirmCls: string
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        disabled={isLoading}
        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
      >
        취소
      </button>
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className={cn(
          'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60',
          confirmCls,
        )}
      >
        {isLoading ? '처리 중...' : confirmLabel}
      </button>
    </div>
  )
}
