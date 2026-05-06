// 거래대행 결제 — 본인 share 만 결제 (feePayer="both" 분기)
//
// 백엔드 spec:
//   POST /api/v1/payments/charge { amount, escrowApplicationId } → tossClientKey
//   Toss SDK 결제창 → POST /payments/charge/confirm
//   confirm 후 application.status: 결제대기 → 결제완료 (양쪽 share 충족 시)
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Receipt, MapPin, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import { paymentApi } from '@/features/payment/api'
import { useAuthStore } from '@/features/auth/store'
import type { EscrowApplication } from '@/features/escrow/types'

export default function EscrowPaymentPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()
  const linkToken = linkId ?? ''
  const currentUser = useAuthStore((s) => s.user)

  const application = (state as { application?: EscrowApplication } | null)?.application
  const [isPaying, setIsPaying] = useState(false)

  if (!application) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500 mb-4">신청 정보가 없어요. 처음부터 다시 진행해 주세요.</p>
        <Button onClick={() => navigate('/escrow/apply')}>대행 신청</Button>
      </div>
    )
  }

  // 본인이 신청자인지 수신자인지에 따라 share 결정
  // 신청자 = link 만든 사람 = (Mode B 에서 보통) buyer 또는 seller
  // 본인 share 결정: feePayer 가 'both' 일 때만 백엔드가 share 분리해서 줌
  // 'buyer' / 'seller' 단일 부담일 때는 부담자가 totalFee 전액 결제, 다른 쪽은 결제 X
  const isBuyer = currentUser?.id === application.buyerId
  const isSeller = currentUser?.id === application.sellerId

  // 내가 부담자인지 + 얼마 내야 하는지
  const myShare: number = (() => {
    if (application.feePayer === 'both') {
      // initiator vs receiver — 누가 initiator 인지는 application 만으로는 불명. 일반적으로 본인이 sellerId 면 신청자(initiator)인 경우와 같지 않음.
      // 백엔드가 initiatorShare/receiverShare 둘 다 줘서 본인 share 만 골라야 함.
      // 라운드9 spec: receiver(=수신자, 폼 작성자) 가 더 큰 share 부담 (예: 1851000)
      // 본인이 sellerId 인지 buyerId 인지는 위에 isBuyer/isSeller 로 분기 가능하지만,
      // initiator vs receiver 매칭은 application.buyerId/sellerId 와 link.initiatorRole 비교 필요.
      // EscrowPaymentPage 진입 시점은 항상 receiver (폼 작성자) 이므로 일단 receiverShare.
      return application.receiverShare
    }
    if (application.feePayer === 'buyer'  && isBuyer)  return application.appliedTotalFee
    if (application.feePayer === 'seller' && isSeller) return application.appliedTotalFee
    return 0  // 본인 부담 X (상대방이 전액)
  })()

  const handlePay = async () => {
    if (myShare <= 0) {
      toast.info('이 거래에서는 결제할 금액이 없어요.')
      navigate(`/escrow/join/${linkToken}/complete`, { state: { application, paid: 0 } })
      return
    }
    setIsPaying(true)
    try {
      // 백엔드 charge → tossClientKey 받음 → 토스 SDK 결제창 띄워야 함
      // (현재 페이지에선 Toss SDK 직접 호출 생략 — 별도 결제 흐름은 ChargePage 와 동일하게 별도 구현 가능)
      await paymentApi.startPayment(myShare, application.id)

      // TODO: Toss SDK 결제창 → confirm
      // 임시: charge 만 호출하고 완료 페이지로
      toast.success('결제 요청을 등록했어요.')
      navigate(`/escrow/join/${linkToken}/complete`, {
        state: { application, paid: myShare },
        replace: true,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '결제 요청에 실패했어요.')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-10 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors text-sm"
      >
        <ArrowLeft size={18} />
        신청서로 돌아가기
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">결제</h1>
        <p className="text-sm text-gray-500">청구 내역을 확인하고 결제를 진행해 주세요.</p>
      </div>

      {/* 영수증 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-primary-600" />
          영수증
        </h2>
        <dl className="space-y-2 text-sm">
          {application.tradeMode === 'INTERNAL' && (
            <Row label="물품 가격" value={`${application.itemPrice.toLocaleString()}원`} />
          )}
          <Row label="배달비" value={`${application.appliedDeliveryFee.toLocaleString()}원`} />
          <Row label={`대행 수수료 (${(application.appliedCommissionRate * 100).toFixed(1)}%)`}
               value={`${application.appliedCommissionFee.toLocaleString()}원`} />
          <hr className="my-2" />
          <Row label="총 청구액" value={`${application.appliedTotalFee.toLocaleString()}원`} bold />
          {application.feePayer === 'both' && (
            <p className="text-xs text-gray-400 mt-1">
              반반 부담 — 신청자 {application.initiatorShare.toLocaleString()}원 / 수신자 {application.receiverShare.toLocaleString()}원
            </p>
          )}
        </dl>
      </section>

      {/* 본인 share */}
      <section className="bg-primary-50 rounded-xl p-5">
        <p className="text-xs text-primary-700 mb-1">내가 결제할 금액</p>
        <p className="text-2xl font-bold text-primary-900">
          {myShare.toLocaleString()}원
        </p>
        {myShare === 0 && (
          <p className="text-xs text-primary-700 mt-1">상대방이 전액 부담합니다.</p>
        )}
      </section>

      {/* 픽업/배달 요약 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-2 text-sm">
        <Row icon={<MapPin size={14} />} label="픽업" value={application.pickupAddress} />
        <Row icon={<MapPin size={14} />} label="배달" value={application.deliveryAddress} />
        {application.tradeMode === 'INTERNAL' && (
          <Row icon={<Package size={14} />} label="거래" value="쓸랭 내 거래" />
        )}
      </section>

      <Button onClick={handlePay} disabled={isPaying} isLoading={isPaying} fullWidth>
        {myShare > 0 ? `${myShare.toLocaleString()}원 결제하기` : '확인'}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        ※ Toss SDK 결제창 통합은 follow-up. 현재는 charge 등록 후 완료 페이지로 이동.
      </p>
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
