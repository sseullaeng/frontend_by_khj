// 관리자 거래대행 모니터링 — read-only
//
// Endpoints:
//   GET /api/v1/admin/escrow/applications?status=&page=&size=
//   GET /api/v1/admin/escrow/applications/{id}
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Hash, MapPin, Package, ShieldAlert, User, X } from 'lucide-react'
import {
  useAdminEscrowApplicationDetail,
  useAdminEscrowApplications,
} from '@/features/escrow/hooks'
import type { EscrowApplication, EscrowApplicationStatus } from '@/features/escrow/types'
import { ESCROW_DISPLAY_COLOR, getEscrowDisplayStatus } from '@/features/escrow/displayStatus'
import { cn } from '@/shared/lib/cn'
import { formatKst, fromNow } from '@/shared/lib/date'

const STATUS_TABS: { value: EscrowApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: '정보입력대기', label: '신청중' },
  { value: '결제대기', label: '결제대기' },
  { value: '결제완료', label: '결제완료' },
  { value: '진행중', label: '진행중' },
  { value: '사용중', label: '사용중' },
  { value: '반납중', label: '반납중' },
  { value: '취소대기', label: '취소대기' },
  { value: '완료', label: '완료' },
  { value: '취소', label: '취소' },
]

const FEE_PAYER_LABEL = {
  buyer: '구매자',
  seller: '판매자',
  both: '양측',
} as const

const TRADE_MODE_LABEL = {
  INTERNAL: '내부거래',
  EXTERNAL: '외부거래',
} as const

function money(value: number | null | undefined): string {
  return value == null ? '-' : `${value.toLocaleString()}원`
}

export default function AdminEscrowApplicationsPage() {
  const navigate = useNavigate()
  const params = useParams()
  const routeId = params.id ? Number(params.id) : null
  const [status, setStatus] = useState<EscrowApplicationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const [detailId, setDetailId] = useState<number | null>(routeId)

  useEffect(() => {
    setDetailId(routeId)
  }, [routeId])

  const { data, isLoading } = useAdminEscrowApplications({
    status: status === 'ALL' ? undefined : status,
    page,
    size: 20,
  })

  const closeDetail = () => {
    setDetailId(null)
    if (routeId) navigate('/admin/escrow/applications', { replace: true })
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={20} className="text-primary-500" />
        <h1 className="text-xl font-bold text-gray-900">거래대행 모니터링</h1>
        <span className="text-sm text-gray-400 ml-auto">총 {data?.totalElements ?? 0}건</span>
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
          <ShieldAlert size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">거래대행 신청이 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data!.content.map((app) => (
            <EscrowRow key={app.id} app={app} onOpen={() => setDetailId(app.id)} />
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

      {detailId != null && <EscrowDetailModal id={detailId} onClose={closeDetail} />}
    </div>
  )
}

function EscrowRow({ app, onOpen }: { app: EscrowApplication; onOpen: () => void }) {
  const displayStatus = getEscrowDisplayStatus(app.status)
  return (
    <li className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50">
      <button onClick={onOpen} className="w-full text-left">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
              ESCROW_DISPLAY_COLOR[displayStatus]
            )}
          >
            {displayStatus}
          </span>
          <span className="text-[11px] text-gray-400 inline-flex items-center gap-0.5">
            <Hash size={10} />
            {app.id}
          </span>
          <span className="text-[11px] text-gray-400 ml-auto">{fromNow(app.createdAt)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {TRADE_MODE_LABEL[app.tradeMode]} · 수수료 {FEE_PAYER_LABEL[app.feePayer]} 부담
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <User size={11} /> 구매자 #{app.buyerId}
              </span>
              <span className="inline-flex items-center gap-1">
                <User size={11} /> 판매자 #{app.sellerId}
              </span>
              {app.deliveryId != null && <span>배송 #{app.deliveryId}</span>}
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm font-bold text-gray-900">{money(app.itemPrice)}</p>
            <p className="text-xs text-gray-500">총 수수료 {money(app.appliedTotalFee)}</p>
          </div>
        </div>
      </button>
    </li>
  )
}

function EscrowDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useAdminEscrowApplicationDetail(id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">거래대행 #{id}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading || !data ? (
          <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <EscrowDetailContent app={data} />
        )}
      </div>
    </div>
  )
}

function EscrowDetailContent({ app }: { app: EscrowApplication }) {
  const displayStatus = getEscrowDisplayStatus(app.status)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <DetailStat label="상태" value={displayStatus} highlight={app.status === '취소대기'} />
        <DetailStat label="물품가" value={money(app.itemPrice)} />
        <DetailStat label="수수료" value={money(app.appliedTotalFee)} />
        <DetailStat
          label="거리"
          value={app.appliedDistanceKm == null ? '-' : `${app.appliedDistanceKm.toFixed(1)}km`}
        />
      </div>

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">당사자</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <InfoBox icon={<User size={13} />} label="구매자" value={`#${app.buyerId}`} />
          <InfoBox icon={<User size={13} />} label="판매자" value={`#${app.sellerId}`} />
        </div>
      </section>

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">금액</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <DetailRow label="배송비" value={money(app.appliedDeliveryFee)} />
          <DetailRow label="중개 수수료" value={money(app.appliedCommissionFee)} />
          <DetailRow label="구매자 부담" value={money(app.initiatorShare)} />
          <DetailRow label="판매자 부담" value={money(app.receiverShare)} />
          <DetailRow label="보증금" value={money(app.depositAmount)} />
        </dl>
      </section>

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">배송 정보</p>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <InfoBox icon={<MapPin size={13} />} label="픽업" value={app.pickupAddress} />
          <InfoBox icon={<MapPin size={13} />} label="도착" value={app.deliveryAddress} />
          <InfoBox
            icon={<Package size={13} />}
            label="옵션"
            value={`무게 ${app.weight} · 부피 ${app.volume} · 파손 ${app.fragility}`}
          />
          {app.receiverPhone && (
            <InfoBox icon={<User size={13} />} label="수령 연락처" value={app.receiverPhone} />
          )}
          {app.deliveryNotes && (
            <InfoBox icon={<Package size={13} />} label="배송 메모" value={app.deliveryNotes} />
          )}
        </div>
      </section>

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">연결 정보</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <DetailRow label="링크 ID" value={`#${app.linkId}`} />
          <DetailRow label="진입 유형" value={app.entryType ?? app.tradeMode} />
          <DetailRow label="채팅방" value={app.chatRoomId == null ? '-' : `#${app.chatRoomId}`} />
          <DetailRow label="배송" value={app.deliveryId == null ? '-' : `#${app.deliveryId}`} />
          <DetailRow label="판매자 입력" value={app.sellerInfoFilled ? '완료' : '대기'} />
          <DetailRow label="구매자 입력" value={app.buyerInfoFilled ? '완료' : '대기'} />
        </dl>
      </section>

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">타임라인</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <DetailRow label="신청" value={formatKst(app.createdAt, 'yyyy.MM.dd HH:mm')} />
          <DetailRow label="수정" value={formatKst(app.updatedAt, 'yyyy.MM.dd HH:mm')} />
          <DetailRow
            label="대여 종료"
            value={app.rentalEndAt ? formatKst(app.rentalEndAt, 'yyyy.MM.dd HH:mm') : '-'}
          />
          <DetailRow
            label="사용 시작"
            value={app.usingStartedAt ? formatKst(app.usingStartedAt, 'yyyy.MM.dd HH:mm') : '-'}
          />
          <DetailRow
            label="반납 요청"
            value={
              app.returnRequestedAt ? formatKst(app.returnRequestedAt, 'yyyy.MM.dd HH:mm') : '-'
            }
          />
          <DetailRow
            label="반납 확인"
            value={
              app.returnConfirmedAt ? formatKst(app.returnConfirmedAt, 'yyyy.MM.dd HH:mm') : '-'
            }
          />
          <DetailRow
            label="판매자 인계"
            value={
              app.handoverConfirmedBySellerAt
                ? formatKst(app.handoverConfirmedBySellerAt, 'yyyy.MM.dd HH:mm')
                : '-'
            }
          />
        </dl>
      </section>

      {app.cancelRequestedAt && (
        <section className="mb-4 border border-red-100 bg-red-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-700 mb-1">취소 요청</p>
          <p className="text-xs text-red-600">
            요청자 #{app.cancelRequestedBy ?? '-'} ·{' '}
            {formatKst(app.cancelRequestedAt, 'yyyy.MM.dd HH:mm')}
          </p>
          {app.cancelReason && <p className="text-sm text-red-700 mt-1">{app.cancelReason}</p>}
        </section>
      )}

      {app.imageUrls.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">첨부 이미지</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {app.imageUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function DetailStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-2.5 py-1.5 border',
        highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
      )}
    >
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={cn('text-sm font-bold', highlight ? 'text-red-600' : 'text-gray-900')}>
        {value}
      </p>
    </div>
  )
}

function InfoBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 break-all">{value}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 pb-1">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900 text-right break-all">{value}</dd>
    </div>
  )
}
