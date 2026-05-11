// 거래대행 — 포인트 결제 화면 (PR-B-5)
//
// URL: /escrow/:id/pay
//   - INTERNAL/EXTERNAL 공용. application id 기준으로 진입.
//   - 본인(buyer/seller) 권한 + 상태=결제대기 일 때만 진입 가능
//   - 본인 share 만큼 포인트 차감 (POST /api/v1/escrow/applications/{id}/pay)
//   - INSUFFICIENT_POINT → 충전 페이지 이동 확인 모달
//
// 라운드13 PR #119 — payment-preview endpoint 통합. myShare/myBalance/deficit/canPay
//   를 서버에서 한 번에 받아 표시. 자체 계산 + usePointBalance 조합 제거.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Package, Receipt, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  useEscrowApplicationDetail,
  useEscrowPaymentPreview,
  usePayEscrowApplication,
} from '@/features/escrow/hooks'
import { useAuthStore } from '@/features/auth/store'
import { Button } from '@/shared/ui/Button'
import { BusinessError } from '@/shared/types/api'
import { formatKst } from '@/shared/lib/date'

export default function EscrowPayPage() {
  const { id } = useParams<{ id: string }>()
  const applicationId = Number(id)
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const { data: app, isLoading } = useEscrowApplicationDetail(applicationId)
  const { data: preview, isLoading: previewLoading } = useEscrowPaymentPreview(applicationId)
  const pay = usePayEscrowApplication(applicationId)

  const [shortfallModal, setShortfallModal] = useState<{
    required: number
    balance: number
  } | null>(null)

  const isBuyer  = !!app && !!currentUser && currentUser.id === app.buyerId
  const isSeller = !!app && !!currentUser && currentUser.id === app.sellerId

  if (isLoading || previewLoading) {
    return <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
  }
  if (!app) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">신청을 찾을 수 없어요.</p>
        <button onClick={() => navigate('/escrow/list')} className="text-primary-500 text-sm">목록으로</button>
      </div>
    )
  }
  if (currentUser && !isBuyer && !isSeller) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">결제 권한이 없어요.</p>
        <button onClick={() => navigate('/escrow/list')} className="text-primary-500 text-sm">목록으로</button>
      </div>
    )
  }
  if (app.status !== '결제대기') {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">
          결제 가능한 상태가 아니에요. (현재: {app.status})
        </p>
        <button
          onClick={() => navigate(`/escrow/list/${applicationId}`)}
          className="text-primary-500 text-sm"
        >
          신청 상세로
        </button>
      </div>
    )
  }

  // 라운드13 PR #119 — 서버 preview 가 진실. 미수신 시 기본값 0/false.
  const myShare      = preview?.myShare      ?? 0
  const balance      = preview?.myBalance    ?? 0
  const deficit      = preview?.deficit      ?? 0
  const canPay       = preview?.canPay       ?? false
  const alreadyPaid  = preview?.alreadyPaid  ?? false
  const insufficient = deficit > 0

  if (alreadyPaid) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 mb-3">이미 결제하셨어요. 상대방의 결제를 기다리고 있어요.</p>
        <button onClick={() => navigate(`/escrow/list/${applicationId}`)} className="text-primary-500 text-sm">
          신청 상세로
        </button>
      </div>
    )
  }

  const handlePay = async () => {
    if (myShare <= 0) {
      toast.info('이 거래에서는 결제할 금액이 없어요.')
      navigate(`/escrow/list/${applicationId}`)
      return
    }
    if (!canPay) {
      setShortfallModal({ required: myShare, balance })
      return
    }
    try {
      await pay.mutateAsync()
      navigate(`/escrow/list/${applicationId}`)
    } catch (err) {
      if (err instanceof BusinessError) {
        if (err.code === 'INSUFFICIENT_POINT') {
          setShortfallModal({ required: myShare, balance })
          return
        }
        toast.error(err.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      }
    }
  }

  const shortfallAmount = shortfallModal ? Math.max(0, shortfallModal.required - shortfallModal.balance) : 0

  return (
    <div className="max-w-lg mx-auto w-full px-4 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">결제</h1>
      </div>

      <div className="flex flex-col gap-4">

        {/* 영수증 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Receipt size={16} className="text-gray-500" /> 영수증
          </h2>
          <dl className="space-y-1.5 text-sm">
            {app.tradeMode === 'INTERNAL' && app.itemPrice > 0 && (
              <Row label="물품 가격" value={`${app.itemPrice.toLocaleString()}원`} />
            )}
            <Row label="배달비" value={`${app.appliedDeliveryFee.toLocaleString()}원`} />
            <Row
              label={`대행 수수료 (${(app.appliedCommissionRate * 100).toFixed(1)}%)`}
              value={`${app.appliedCommissionFee.toLocaleString()}원`}
            />
            <hr className="my-2" />
            <Row label="총 청구액" value={`${app.appliedTotalFee.toLocaleString()}원`} bold />
            {app.feePayer === 'both' && (
              <p className="text-[11px] text-gray-400 mt-1">반반 부담 — 양쪽이 절반씩 결제합니다.</p>
            )}
          </dl>
        </section>

        {/* 내가 결제할 금액 + 잔액 */}
        <section className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
          <p className="text-xs text-primary-700 mb-1">내가 결제할 금액</p>
          <p className="text-3xl font-bold text-primary-900 mb-3">{myShare.toLocaleString()}원</p>
          <div className="flex items-center justify-between text-xs text-primary-700/80">
            <span className="inline-flex items-center gap-1">
              <Wallet size={12} /> 현재 잔액
            </span>
            <span className={insufficient ? 'text-red-600 font-semibold' : 'text-primary-900 font-medium'}>
              {balance.toLocaleString()}원
            </span>
          </div>
          {insufficient && myShare > 0 && (
            <p className="text-[11px] text-red-600 mt-1">
              {deficit.toLocaleString()}원이 부족해요.
            </p>
          )}
          {preview?.paymentDueAt && (
            <p className="text-[11px] text-primary-700/70 mt-1">
              결제 마감 — {formatKst(preview.paymentDueAt, 'yyyy.MM.dd HH:mm')}
            </p>
          )}
        </section>

        {/* 거래 요약 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2 text-sm">
          <Row icon={<MapPin size={14} />}  label="픽업" value={app.pickupAddress} />
          <Row icon={<MapPin size={14} />}  label="배달" value={app.deliveryAddress} />
          <Row icon={<Package size={14} />} label="거래" value={app.tradeMode === 'INTERNAL' ? '쓸랭 내 거래' : '외부 거래'} />
        </section>

        <p className="text-xs text-gray-400 leading-relaxed">
          · 결제 즉시 포인트가 차감되며, 양쪽 결제가 완료되면 라이더 매칭이 시작돼요.<br />
          · 라이더 매칭 후에는 본인 단독 취소가 불가능해요.
        </p>

        <Button
          onClick={handlePay}
          isLoading={pay.isPending}
          disabled={pay.isPending}
          fullWidth
        >
          {myShare > 0 ? `${myShare.toLocaleString()}원 결제하기` : '확인'}
        </Button>
      </div>

      {shortfallModal && (
        <InsufficientPointModal
          required={shortfallModal.required}
          balance={shortfallModal.balance}
          shortfall={shortfallAmount}
          onClose={() => setShortfallModal(null)}
          onCharge={() => navigate('/point/charge')}
        />
      )}
    </div>
  )
}

function Row({ label, value, bold, icon }: { label: string; value: string; bold?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-500 flex items-center gap-1">{icon}{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'text-gray-900'}>{value}</span>
    </div>
  )
}

function InsufficientPointModal({
  required, balance, shortfall, onClose, onCharge,
}: {
  required: number
  balance:  number
  shortfall: number
  onClose:  () => void
  onCharge: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
        <h3 className="text-base font-bold text-gray-900 mb-2">포인트가 부족해요</h3>
        <dl className="text-sm text-gray-600 space-y-1 mb-5">
          <div className="flex justify-between">
            <dt>필요 금액</dt>
            <dd className="text-gray-900 font-medium">{required.toLocaleString()}원</dd>
          </div>
          <div className="flex justify-between">
            <dt>현재 잔액</dt>
            <dd className="text-gray-900 font-medium">{balance.toLocaleString()}원</dd>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-100">
            <dt className="text-red-600">부족액</dt>
            <dd className="text-red-600 font-semibold">{shortfall.toLocaleString()}원</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-500 mb-4">포인트 충전 페이지로 이동할까요?</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            돌아가기
          </button>
          <button
            onClick={onCharge}
            className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            충전하기
          </button>
        </div>
      </div>
    </div>
  )
}
