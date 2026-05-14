// 관리자 연체 관리
//
// GET /api/v1/admin/overdue?status=&phase=&page=&size=
// GET /api/v1/admin/overdue/{id}
// PATCH /api/v1/admin/overdue/{id}/legal-action  { action }
// PATCH /api/v1/admin/overdue/{id}/resolve       { note }
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Gavel,
  RefreshCcw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useAdminOverdueDetail,
  useAdminOverdueList,
  useAdminOverduePatchLegalAction,
  useAdminOverdueRecompute,
  useAdminOverdueResolve,
} from '@/features/overdue/hooks'
import type {
  OverdueLegalAction,
  OverduePhase,
  OverdueRecord,
  OverdueStatus,
} from '@/features/overdue/types'
import { SelectDropdown, type SelectDropdownOption } from '@/shared/ui/SelectDropdown'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { formatKst } from '@/shared/lib/date'

type StatusFilter = 'ALL' | OverdueStatus
type PhaseFilter = 'ALL' | OverduePhase
type LegalActionForm = Exclude<OverdueLegalAction, 'NONE'>

const STATUS_OPTIONS: readonly SelectDropdownOption<StatusFilter>[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: '진행중', label: '진행중' },
  { value: '정산완료', label: '정산완료' },
  { value: '법적조치중', label: '법적조치중' },
  { value: '종료', label: '종료' },
]

const PHASE_OPTIONS: readonly SelectDropdownOption<PhaseFilter>[] = [
  { value: 'ALL', label: '전체 단계' },
  { value: 'PHASE_1', label: '1단계' },
  { value: 'PHASE_2', label: '2단계' },
  { value: 'PHASE_3', label: '3단계' },
  { value: 'PHASE_4', label: '4단계' },
]

const LEGAL_ACTION_OPTIONS: readonly SelectDropdownOption<LegalActionForm>[] = [
  { value: '내용증명', label: '내용증명' },
  { value: '분쟁조정', label: '분쟁조정' },
  { value: '소송제기', label: '소송제기' },
]

const PHASE_STYLE: Record<OverduePhase, { label: string; cls: string }> = {
  PHASE_1: { label: '1단계', cls: 'bg-yellow-100 text-yellow-800' },
  PHASE_2: { label: '2단계', cls: 'bg-orange-100 text-orange-700' },
  PHASE_3: { label: '3단계', cls: 'bg-red-100 text-red-700' },
  PHASE_4: { label: '4단계', cls: 'bg-red-600 text-white' },
}

const STATUS_STYLE: Record<OverdueStatus, string> = {
  진행중: 'bg-red-100 text-red-700',
  정산완료: 'bg-gray-100 text-gray-600',
  법적조치중: 'bg-rose-200 text-rose-800',
  종료: 'bg-gray-100 text-gray-500',
}

export default function AdminOverduePage() {
  const [status, setStatus] = useState<StatusFilter>('진행중')
  const [phase, setPhase] = useState<PhaseFilter>('ALL')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const params = useMemo(
    () => ({
      status: status === 'ALL' ? undefined : status,
      phase: phase === 'ALL' ? undefined : phase,
      page,
      size: 20,
    }),
    [status, phase, page]
  )
  const { data, isLoading } = useAdminOverdueList(params)
  const list = data?.content ?? []

  const resetFilters = () => {
    setStatus('ALL')
    setPhase('ALL')
    setPage(0)
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={20} className="text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">연체 관리</h1>
        <span className="ml-auto text-sm text-gray-400">총 {data?.totalElements ?? 0}건</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Search size={15} className="text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">필터</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectDropdown
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(0)
            }}
            options={STATUS_OPTIONS}
            className="w-full sm:w-auto"
            buttonClassName="w-full sm:w-36"
          />
          <SelectDropdown
            value={phase}
            onChange={(value) => {
              setPhase(value)
              setPage(0)
            }}
            options={PHASE_OPTIONS}
            className="w-full sm:w-auto"
            buttonClassName="w-full sm:w-32"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <X size={14} />
            초기화
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
          <AlertTriangle size={42} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">연체 기록이 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((record) => (
            <OverdueListItem key={record.id} record={record} onOpen={() => setSelectedId(record.id)} />
          ))}
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

      {selectedId != null && <OverdueDetailModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

function OverdueListItem({ record, onOpen }: { record: OverdueRecord; onOpen: () => void }) {
  return (
    <li className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <PhaseBadge phase={record.phase} />
          <StatusBadge status={record.status} />
          {record.legalAction && record.legalAction !== 'NONE' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
              <Gavel size={10} /> {record.legalAction}
            </span>
          )}
          <span className="text-[11px] text-gray-400">연체 #{record.id}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          거래대행 #{record.escrowApplicationId} · {record.overdueDays}일 연체
        </p>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <Field label="보증금" value={`${record.depositAmount.toLocaleString()}원`} />
          <Field label="차감" value={`${record.depositForfeitedAmount.toLocaleString()}원`} highlight />
          <Field label="잔여 보증금" value={`${record.remainingDeposit.toLocaleString()}원`} />
          <Field
            label="초과 채무"
            value={`${record.extraDebtAmount.toLocaleString()}원`}
            highlight={record.extraDebtAmount > 0}
          />
        </dl>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
          <span>반납 기한 {formatKst(record.rentalEndAt, 'yyyy.MM.dd HH:mm')}</span>
          {record.buyerId != null && <span>구매자 #{record.buyerId}</span>}
          {record.sellerId != null && <span>판매자 #{record.sellerId}</span>}
        </div>
      </div>
      <div className="flex sm:flex-col gap-1.5 shrink-0">
        <Button size="sm" variant="outline" onClick={onOpen}>
          상세
        </Button>
      </div>
    </li>
  )
}

function OverdueDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useAdminOverdueDetail(id)
  const patchLegal = useAdminOverduePatchLegalAction()
  const resolve = useAdminOverdueResolve()
  const recompute = useAdminOverdueRecompute()
  const [legalAction, setLegalAction] = useState<LegalActionForm>('내용증명')
  const [note, setNote] = useState('')

  const disabled =
    patchLegal.isPending || resolve.isPending || recompute.isPending || isLoading || !data

  const submitLegalAction = async () => {
    if (!data) return
    await patchLegal.mutateAsync({ id: data.id, body: { action: legalAction } })
  }

  const submitResolve = async () => {
    if (!data) return
    await resolve.mutateAsync({ id: data.id, body: { note: note.trim() || undefined } })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[calc(100vh-3rem)] shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">연체 상세</h3>
            <p className="text-xs text-gray-500 mt-1">
              법적 조치 단계 전이와 운영 강제 종료를 처리합니다.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !data ? (
            <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
          ) : (
            <div className="flex flex-col gap-5">
              <section className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <PhaseBadge phase={data.phase} />
                  <StatusBadge status={data.status} />
                  <span className="text-xs text-gray-400">연체 #{data.id}</span>
                  <Link
                    to={`/admin/escrow/applications/${data.escrowApplicationId}`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    거래대행 #{data.escrowApplicationId}
                  </Link>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="연체 일수" value={`${data.overdueDays}일`} highlight />
                  <Field label="법적 조치" value={data.legalAction ?? 'NONE'} />
                  <Field label="보증금" value={`${data.depositAmount.toLocaleString()}원`} />
                  <Field label="차감된 보증금" value={`${data.depositForfeitedAmount.toLocaleString()}원`} />
                  <Field label="잔여 보증금" value={`${data.remainingDeposit.toLocaleString()}원`} />
                  <Field
                    label="초과 채무"
                    value={`${data.extraDebtAmount.toLocaleString()}원`}
                    highlight={data.extraDebtAmount > 0}
                  />
                  {data.buyerId != null && <Field label="구매자" value={`#${data.buyerId}`} />}
                  {data.sellerId != null && <Field label="판매자" value={`#${data.sellerId}`} />}
                  <Field label="반납 기한" value={formatKst(data.rentalEndAt, 'yyyy.MM.dd HH:mm')} />
                  <Field label="연체 시작" value={formatKst(data.overdueStartedAt, 'yyyy.MM.dd HH:mm')} />
                  {data.accountSuspendedAt && (
                    <Field label="계정 정지" value={formatKst(data.accountSuspendedAt, 'yyyy.MM.dd HH:mm')} />
                  )}
                  {data.resolvedAt && (
                    <Field label="종료 시각" value={formatKst(data.resolvedAt, 'yyyy.MM.dd HH:mm')} />
                  )}
                </dl>
                {data.resolutionNote && (
                  <p className="mt-3 text-xs text-gray-500">종료 메모: {data.resolutionNote}</p>
                )}
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">법적 조치 전이</p>
                  <p className="text-xs text-gray-500 mb-3">
                    내용증명, 분쟁조정, 소송제기 단계로 상태를 전이합니다.
                  </p>
                  <div className="flex gap-2">
                    <SelectDropdown
                      value={legalAction}
                      onChange={setLegalAction}
                      options={LEGAL_ACTION_OPTIONS}
                      className="flex-1"
                      buttonClassName="w-full"
                      disabled={disabled}
                    />
                    <Button size="sm" onClick={submitLegalAction} disabled={disabled}>
                      적용
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">강제 종료</p>
                  <p className="text-xs text-red-700/80 mb-3">
                    운영 판단으로 연체 record를 종료합니다. 금액 변경은 백엔드 정산 정책을 따릅니다.
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="관리자 메모"
                    className="w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm outline-none focus:border-red-300"
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="mt-2 w-full"
                    onClick={submitResolve}
                    disabled={disabled}
                  >
                    강제 종료
                  </Button>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => recompute.mutate(id)}
            disabled={disabled}
            className="inline-flex items-center gap-1"
          >
            <RefreshCcw size={14} />
            재계산
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

function PhaseBadge({ phase }: { phase: OverduePhase }) {
  const style = PHASE_STYLE[phase] ?? { label: phase, cls: 'bg-gray-100 text-gray-700' }
  return <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', style.cls)}>{style.label}</span>
}

function StatusBadge({ status }: { status: OverdueStatus }) {
  return (
    <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded', STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={cn('truncate font-medium', highlight ? 'text-red-600' : 'text-gray-900')}>
        {value}
      </dd>
    </div>
  )
}
