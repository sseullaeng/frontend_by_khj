// 거래대행 결제 — Toss 결제 위젯 통합 (R1 마무리)
//
// 흐름:
//   1) startPayment(myShare, escrowApplicationId) → tossClientKey + merchantUid
//   2) loadPaymentWidget + renderPaymentMethods/Agreement
//   3) widget.requestPayment(successUrl=callback) → Toss 결제창
//   4) callback → confirmPayment + 백엔드 application.status 자동 갱신
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Receipt, MapPin, Package } from 'lucide-react'
import { toast } from 'sonner'
import { loadPaymentWidget, type PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk'
import { Button } from '@/shared/ui/Button'
import { paymentApi } from '@/features/payment/api'
import { useAuthStore } from '@/features/auth/store'
import { BusinessError } from '@/shared/types/api'
import type { EscrowApplication } from '@/features/escrow/types'

const SUCCESS_URL = `${window.location.origin}/escrow/payment/callback`
const FAIL_URL    = `${window.location.origin}/escrow/payment/callback`
const PENDING_KEY = 'escrow_payment_pending'

export default function EscrowPaymentPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()
  const linkToken = linkId ?? ''
  const currentUser = useAuthStore((s) => s.user)

  const application = (state as { application?: EscrowApplication } | null)?.application

  const [widget, setWidget] = useState<PaymentWidgetInstance | null>(null)
  const [widgetLoading, setWidgetLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const renderedRef = useRef(false)

  // 본인 share 계산
  const myShare: number = (() => {
    if (!application || !currentUser) return 0
    const isBuyer  = currentUser.id === application.buyerId
    const isSeller = currentUser.id === application.sellerId
    if (application.feePayer === 'both') {
      // 폼 작성자(receiver) 기준 — receiverShare. (initiator 측은 별도 결제 흐름 또는 in-app 알림으로 처리)
      return application.receiverShare
    }
    if (application.feePayer === 'buyer'  && isBuyer)  return application.appliedTotalFee
    if (application.feePayer === 'seller' && isSeller) return application.appliedTotalFee
    return 0
  })()

  // Toss 위젯 로드 + 렌더 (mount 1회)
  useEffect(() => {
    if (!application || !currentUser || myShare <= 0) {
      setWidgetLoading(false)
      return
    }
    if (renderedRef.current) return
    renderedRef.current = true

    const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY
    if (!TOSS_CLIENT_KEY) {
      toast.error('VITE_TOSS_CLIENT_KEY 환경변수가 비어있어요.')
      setWidgetLoading(false)
      return
    }

    loadPaymentWidget(TOSS_CLIENT_KEY, String(currentUser.id))
      .then((w) => {
        w.renderPaymentMethods('#escrow-payment-method', { value: myShare, currency: 'KRW' })
        w.renderAgreement('#escrow-agreement', { variantKey: 'AGREEMENT' })
        setWidget(w)
      })
      .catch((err) => {
        console.error(err)
        toast.error('결제 위젯을 불러오지 못했어요.')
      })
      .finally(() => setWidgetLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, application?.id])

  if (!application) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500 mb-4">신청 정보가 없어요. 처음부터 다시 진행해 주세요.</p>
        <Button onClick={() => navigate('/escrow/apply')}>대행 신청</Button>
      </div>
    )
  }

  const handlePay = async () => {
    if (myShare <= 0) {
      toast.info('이 거래에서는 결제할 금액이 없어요.')
      navigate(`/escrow/join/${linkToken}/complete`, {
        state: { application, paid: 0 },
        replace: true,
      })
      return
    }
    if (!widget || !currentUser) return

    setPaying(true)
    try {
      // 1) 백엔드 charge → merchantUid + (선택) tossClientKey
      const { data } = await paymentApi.startPayment(myShare, application.id)

      // 2) callback 페이지에서 사용할 컨텍스트 저장
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        applicationId: application.id,
        linkToken,
      }))

      // 3) Toss 결제창 (success 시 callback 으로 redirect)
      await widget.requestPayment({
        orderId: data.merchantUid,
        orderName: application.tradeMode === 'INTERNAL' ? '쓸랭 거래대행 결제' : '거래대행 (외부)',
        customerEmail: currentUser.email,
        customerName: currentUser.nickname,
        successUrl: SUCCESS_URL,
        failUrl:    FAIL_URL,
      })
    } catch (err) {
      const isCanceled = err instanceof Error && /USER_CANCEL|user_cancel|취소/.test(err.message)
      if (!isCanceled) {
        const msg =
          err instanceof BusinessError ? err.message :
          err instanceof Error ? err.message : '결제를 시작하지 못했어요.'
        toast.error(msg)
      }
      sessionStorage.removeItem(PENDING_KEY)
      setPaying(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-32 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors text-sm w-fit"
      >
        <ArrowLeft size={18} />
        신청서로 돌아가기
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">결제</h1>
        <p className="text-sm text-gray-500">청구 내역을 확인하고 결제 수단을 선택해 주세요.</p>
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
        <p className="text-2xl font-bold text-primary-900">{myShare.toLocaleString()}원</p>
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

      {/* Toss 결제 위젯 */}
      {myShare > 0 && (
        <>
          <div id="escrow-payment-method" className="bg-white rounded-xl border border-gray-200 p-1 min-h-[160px]" />
          <div id="escrow-agreement" className="bg-white rounded-xl border border-gray-200 p-1 min-h-[80px]" />
          {widgetLoading && <p className="text-xs text-gray-400 text-center">결제 위젯 로딩 중...</p>}
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handlePay}
            disabled={paying || (myShare > 0 && !widget)}
            isLoading={paying}
            fullWidth
          >
            {myShare > 0 ? `${myShare.toLocaleString()}원 결제하기` : '확인'}
          </Button>
        </div>
      </div>
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
