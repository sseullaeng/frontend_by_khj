// 관리자 — 연체 관리 목록 (라운드14)
//
// URL: /admin/overdue
//   - GET /api/v1/admin/overdue?status=&phase=&legalAction=&page=&size=
//   - 행 클릭 → /admin/overdue/{id}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Filter, Gavel } from 'lucide-react'
import { useAdminOverdueList } from '@/features/overdue/hooks'
import type {
  AdminOverdueListParams,
  OverdueLegalAction,
  OverduePhase,
  OverdueRecord,
  OverdueStatus,
} from '@/features/overdue/types'
import { PHASE_STYLE, STATUS_STYLE } from '@/features/overdue/labels'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const PAGE_SIZE = 20

const STATUS_OPTIONS: { value: '' | OverdueStatus; label: string }[] = [
  { value: '',           label: '전체 상태' },
  { value: '진행중',     label: '진행중' },
  { value: '법적조치중', label: '법적조치중' },
  { value: '정산완료',   label: '정산완료' },
  { value: '종료',       label: '종료' },
]
const PHASE_OPTIONS: { value: '' | OverduePhase; label: string }[] = [
  { value: '',        label: '전체 단계' },
  { value: 'PHASE_1', label: '1단계 (D+1)' },
  { value: 'PHASE_2', label: '2단계 (D+3)' },
  { value: 'PHASE_3', label: '3단계 (D+7)' },
  { value: 'PHASE_4', label: '4단계 (D+14)' },
]
const LEGAL_OPTIONS: { value: '' | OverdueLegalAction; label: string }[] = [
  { value: '',         label: '법적조치 전체' },
  { value: 'NONE',     label: '조치 없음' },
  { value: '내용증명', label: '내용증명' },
  { value: '분쟁조정', label: '분쟁조정' },
  { value: '소송제기', label: '소송제기' },
]

export default function AdminOverduePage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'' | OverdueStatus>('진행중')
  const [phase, setPhase] = useState<'' | OverduePhase>('')
  const [legal, setLegal] = useState<'' | OverdueLegalAction>('')
  const [page, setPage] = useState(0)

  const params: AdminOverdueListParams = {
    page,
    size: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(phase ? { phase } : {}),
    ...(legal ? { legalAction: legal } : {}),
  }

  const { data, isLoading } = useAdminOverdueList(params)
  const records = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          연체 관리
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          대여 거래대행 반납 기한 초과 record · 보증금 차감 / 누적 채무 / 법적 조치 관리
        </p>
      </header>

      {/* 필터 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">필터</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={status} onChange={(v) => { setStatus(v as '' | OverdueStatus); setPage(0) }} options={STATUS_OPTIONS} />
          <Select value={phase}  onChange={(v) => { setPhase(v as '' | OverduePhase);  setPage(0) }} options={PHASE_OPTIONS} />
          <Select value={legal}  onChange={(v) => { setLegal(v as '' | OverdueLegalAction); setPage(0) }} options={LEGAL_OPTIONS} />
        </div>
      </section>

      {/* 결과 */}
      <p className="text-xs text-gray-500 mb-2">총 {totalElements.toLocaleString()}건</p>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : records.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
          조건에 해당하는 연체 기록이 없어요.
        </p>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {records.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => navigate(`/admin/overdue/${r.id}`)}
                className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 text-left transition-colors"
              >
                <Row record={r} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded border border-gray-200 disabled:opacity-30"
            aria-label="이전"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded border border-gray-200 disabled:opacity-30"
            aria-label="다음"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function Select({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Row({ record: r }: { record: OverdueRecord }) {
  const phase = PHASE_STYLE[r.phase] ?? { label: r.phase, cls: 'bg-gray-100 text-gray-700' }
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="text-xs font-mono text-gray-400">#{r.id}</span>
        <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', phase.cls)}>{phase.label}</span>
        <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded', STATUS_STYLE[r.status] ?? 'bg-gray-100 text-gray-700')}>
          {r.status}
        </span>
        {r.legalAction !== 'NONE' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
            <Gavel size={10} /> {r.legalAction}
          </span>
        )}
        <span className="text-[11px] text-gray-400 ml-auto">
          {r.overdueDays}일 경과
        </span>
      </div>
      <p className="text-xs text-gray-600">
        거래 #{r.escrowApplicationId} · 구매자 #{r.buyerId} → 판매자 #{r.sellerId}
      </p>
      <div className="grid grid-cols-3 gap-x-3 mt-1.5 text-[11px] text-gray-500">
        <span>
          남은 보증금 <b className="text-gray-800">{r.remainingDeposit.toLocaleString()}</b>원
        </span>
        <span>
          차감 <b className="text-gray-800">{r.depositForfeitedAmount.toLocaleString()}</b>원
        </span>
        <span className={r.extraDebtAmount > 0 ? 'text-red-600' : ''}>
          채무 <b>{r.extraDebtAmount.toLocaleString()}</b>원
        </span>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">
        반납기한 {formatKst(r.rentalEndAt, 'yyyy.MM.dd HH:mm')}
        {r.accountSuspendedAt ? ` · 계정 정지 ${formatKst(r.accountSuspendedAt, 'yyyy.MM.dd')}` : ''}
      </p>
    </div>
  )
}
