// 관리자 배달 모니터링 — 라운드13 PR #134
//
// Endpoints:
//   GET /api/v1/admin/deliveries?status=&riderId=&requesterId=&createdAfter=&createdBefore=&sort=
//   GET /api/v1/admin/deliveries/stats   — 상태별 카운트 카드용
import { useState } from 'react'
import { Truck, Search, Hash, MapPin, User, Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminDeliveries, useAdminDeliveryStats } from '@/features/admin/hooks'
import type { AdminDeliveryItem, AdminDeliveryListParams } from '@/features/admin/types'
import type { DeliveryStatus } from '@/features/delivery/types'
import { fromNow, formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_TABS: { value: DeliveryStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL', label: '전체', color: 'text-gray-700' },
  { value: '모집중', label: '모집중', color: 'text-amber-700' },
  { value: '수락', label: '수락', color: 'text-blue-700' },
  { value: '배송중', label: '배송중', color: 'text-purple-700' },
  { value: '배송완료', label: '배송완료', color: 'text-emerald-700' },
  { value: '정산완료', label: '정산완료', color: 'text-emerald-700' },
  { value: '취소', label: '취소', color: 'text-gray-500' },
]

const SORT_OPTIONS = [
  { value: 'latest', label: '최신 요청순' },
  { value: 'picked_up_desc', label: '픽업 늦은 순' },
] as const

const STATUS_BADGE_CLS: Record<DeliveryStatus, string> = {
  모집중: 'bg-amber-100 text-amber-700',
  수락: 'bg-blue-100 text-blue-700',
  배송중: 'bg-purple-100 text-purple-700',
  배송완료: 'bg-emerald-100 text-emerald-700',
  정산완료: 'bg-emerald-200 text-emerald-800',
  취소: 'bg-gray-100 text-gray-500',
}

export default function AdminDeliveryPage() {
  const [status, setStatus] = useState<DeliveryStatus | 'ALL'>('ALL')
  const [requesterIdInput, setRequesterIdInput] = useState('')
  const [riderIdInput, setRiderIdInput] = useState('')
  const [requesterId, setRequesterId] = useState<number | undefined>()
  const [riderId, setRiderId] = useState<number | undefined>()
  const [sort, setSort] = useState<AdminDeliveryListParams['sort']>('latest')
  const [page, setPage] = useState(0)

  const params: AdminDeliveryListParams = {
    status: status === 'ALL' ? undefined : status,
    requesterId,
    riderId,
    sort,
    page,
    size: 20,
  }
  const { data, isLoading } = useAdminDeliveries(params)
  const { data: stats } = useAdminDeliveryStats()

  const handleApplyId = () => {
    const r = requesterIdInput.trim() ? Number(requesterIdInput.trim()) : undefined
    const ri = riderIdInput.trim() ? Number(riderIdInput.trim()) : undefined
    setRequesterId(Number.isFinite(r) ? r : undefined)
    setRiderId(Number.isFinite(ri) ? ri : undefined)
    setPage(0)
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Truck size={20} className="text-primary-500" />
        <h1 className="text-xl font-bold text-gray-900">배달 모니터링</h1>
      </div>

      {/* 상태별 카운트 카드 */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">상태별 현황</p>
            <p className="text-[11px] text-gray-500">
              총 {stats.total.toLocaleString()}건 · 오늘 신규 {stats.todayNew.toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
            {(['모집중', '수락', '배송중', '배송완료', '정산완료', '취소'] as DeliveryStatus[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    setPage(0)
                  }}
                  className={cn(
                    'rounded-lg py-1.5 border transition-colors',
                    status === s
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <p className="text-[10px] text-gray-500">{s}</p>
                  <p className={cn('text-sm font-bold', STATUS_BADGE_CLS[s].split(' ')[1])}>
                    {(stats.byStatus[s] ?? 0).toLocaleString()}
                  </p>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* 필터 바 */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-col gap-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setStatus(t.value)
                setPage(0)
              }}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                status === t.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">의뢰자 ID</span>
            <input
              type="number"
              value={requesterIdInput}
              onChange={(e) => setRequesterIdInput(e.target.value)}
              placeholder="#"
              className="w-20 h-8 px-2 border border-gray-300 rounded outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">라이더 ID</span>
            <input
              type="number"
              value={riderIdInput}
              onChange={(e) => setRiderIdInput(e.target.value)}
              placeholder="#"
              className="w-20 h-8 px-2 border border-gray-300 rounded outline-none focus:border-primary-500"
            />
          </div>
          <button
            onClick={handleApplyId}
            className="inline-flex items-center gap-1 px-3 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            <Search size={11} /> 적용
          </button>
          <select
            value={sort ?? 'latest'}
            onChange={(e) => {
              setSort(e.target.value as AdminDeliveryListParams['sort'])
              setPage(0)
            }}
            className="h-8 px-2 border border-gray-300 rounded bg-white text-gray-700 ml-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (data?.content.length ?? 0) === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Truck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">결과가 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data!.content.map((d) => (
            <DeliveryRow key={d.id} delivery={d} />
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
    </div>
  )
}

function DeliveryRow({ delivery: d }: { delivery: AdminDeliveryItem }) {
  return (
    <li className="bg-white border border-gray-200 rounded-xl p-3 hover:bg-gray-50">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span
          className={cn(
            'text-[10px] px-1.5 py-0.5 rounded font-medium',
            STATUS_BADGE_CLS[d.status]
          )}
        >
          {d.status}
        </span>
        <span className="text-[11px] text-gray-400 inline-flex items-center gap-0.5">
          <Hash size={10} />
          {d.id}
        </span>
        <span className="text-xs font-semibold text-gray-900 ml-auto">
          {d.fee.toLocaleString()}원
        </span>
      </div>

      <p className="text-sm text-gray-800 mb-1.5 line-clamp-1">{d.itemDescription}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 mb-1.5">
        <div className="inline-flex items-start gap-1">
          <MapPin size={11} className="mt-0.5 text-amber-500 shrink-0" />
          <span className="line-clamp-1">
            <b className="text-gray-500 font-normal">픽업</b> {d.pickupAddress}
          </span>
        </div>
        <div className="inline-flex items-start gap-1">
          <MapPin size={11} className="mt-0.5 text-emerald-500 shrink-0" />
          <span className="line-clamp-1">
            <b className="text-gray-500 font-normal">도착</b> {d.dropoffAddress}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <User size={11} /> 의뢰{' '}
          <Link to={`/users/${d.requesterId}`} className="text-primary-600 hover:underline">
            {d.requesterNickname} #{d.requesterId}
          </Link>
        </span>
        {d.riderId != null && (
          <span className="inline-flex items-center gap-1">
            <User size={11} /> 라이더{' '}
            <Link to={`/users/${d.riderId}`} className="text-primary-600 hover:underline">
              {d.riderNickname ?? '?'} #{d.riderId}
            </Link>
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock size={11} /> 요청 {fromNow(d.requestedAt)}
        </span>
        {d.pickedUpAt && (
          <span className="text-gray-400">픽업 {formatKst(d.pickedUpAt, 'M.d HH:mm')}</span>
        )}
        {d.deliveredAt && (
          <span className="text-gray-400">도착 {formatKst(d.deliveredAt, 'M.d HH:mm')}</span>
        )}
        {d.escrowApplicationId != null && (
          <Link
            to={`/admin/escrow/applications/${d.escrowApplicationId}`}
            target="_blank"
            className="inline-flex items-center gap-0.5 text-primary-600 hover:underline ml-auto"
          >
            <ExternalLink size={11} /> 거래대행 #{d.escrowApplicationId}
          </Link>
        )}
      </div>

      {d.status === '취소' && d.cancelReason && (
        <p className="text-[11px] text-red-500 mt-1.5">취소 사유: {d.cancelReason}</p>
      )}
    </li>
  )
}
