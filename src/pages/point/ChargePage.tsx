// 포인트 충전 페이지 — 토스페이먼츠 결제 위젯 연동 (가이드 §6)
//
// 흐름:
//   1) 페이지 진입 → 토스 결제 위젯 SDK 로드 + 결제수단/약관 렌더
//   2) 사용자가 금액 선택/입력 → methodsWidget.updateAmount 로 위젯 금액 동기화
//   3) "결제하기" 클릭:
//      - POST /api/v1/payments/charge { amount } → { merchantUid }
//      - widget.requestPayment({ orderId: merchantUid, ... }) → 토스 successUrl 로 redirect
//   4) 콜백 페이지(/point/charge/callback) 가 paymentKey/orderId/amount 받아
//      POST /api/v1/payments/charge/confirm 호출 → 잔액 반영

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  loadPaymentWidget,
  type PaymentWidgetInstance,
} from '@tosspayments/payment-widget-sdk'
import { paymentApi } from '@/features/payment/api'
import { useAuthStore } from '@/features/auth/store'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { BusinessError } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

type PaymentMethodsWidget = ReturnType<PaymentWidgetInstance['renderPaymentMethods']>

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY
const PRESET_AMOUNTS = [10_000, 30_000, 50_000, 100_000, 300_000, 500_000]
const MIN_AMOUNT = 1_000
const MAX_AMOUNT = 1_000_000
const SUCCESS_URL = `${window.location.origin}/point/charge/callback`
const FAIL_URL = `${window.location.origin}/point/charge/callback`

export default function ChargePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isVerified } = useEmailGuard()

  const [amount, setAmount] = useState(10_000)
  const [customInput, setCustomInput] = useState('')
  const [widget, setWidget] = useState<PaymentWidgetInstance | null>(null)
  const [methodsWidget, setMethodsWidget] = useState<PaymentMethodsWidget | null>(null)
  const [widgetLoading, setWidgetLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const renderedRef = useRef(false)

  // 1) 위젯 로드 + 렌더 (페이지 mount 1회)
  useEffect(() => {
    if (!user) return
    if (!TOSS_CLIENT_KEY) {
      toast.error('VITE_TOSS_CLIENT_KEY 환경변수가 비어있어요.')
      setWidgetLoading(false)
      return
    }
    if (renderedRef.current) return
    renderedRef.current = true

    loadPaymentWidget(TOSS_CLIENT_KEY, String(user.id))
      .then(async (w) => {
        // renderPaymentMethods 는 PaymentMethodsWidget 인스턴스를 반환 — 여기에 updateAmount 가 있음.
        // (paymentWidget 자체에는 updateAmount 없음 — 0.11 이전 시그니처와 차이)
        const methods = w.renderPaymentMethods(
          '#payment-method',
          { value: amount, currency: 'KRW' },
        )
        await w.renderAgreement('#agreement', { variantKey: 'AGREEMENT' })
        setWidget(w)
        setMethodsWidget(methods)
      })
      .catch((err) => {
        console.error(err)
        toast.error('결제 위젯을 불러오지 못했어요.')
      })
      .finally(() => setWidgetLoading(false))
    // amount 는 의도적으로 deps 미포함 — mount 1회만 렌더, 이후 갱신은 updateAmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // 2) 금액 변경 시 위젯 업데이트 — methodsWidget.updateAmount(amount: number, reason?)
  useEffect(() => {
    methodsWidget?.updateAmount(amount)
  }, [amount, methodsWidget])

  // 3) 결제 요청
  const handleCharge = async () => {
    if (!widget || !user) return
    if (!isVerified) {
      toast.error('이메일 인증 후 결제할 수 있어요.')
      return
    }
    if (amount < MIN_AMOUNT) {
      toast.error(`최소 ${MIN_AMOUNT.toLocaleString()}원부터 충전 가능해요.`)
      return
    }
    if (amount > MAX_AMOUNT) {
      toast.error(`1회 최대 ${MAX_AMOUNT.toLocaleString()}원까지 충전 가능해요.`)
      return
    }

    setPaying(true)
    try {
      const { data } = await paymentApi.startPayment(amount)

      await widget.requestPayment({
        orderId: data.merchantUid,
        orderName: '쓸랭 포인트 충전',
        customerEmail: user.email,
        customerName: user.nickname,
        successUrl: SUCCESS_URL,
        failUrl: FAIL_URL,
      })
    } catch (err) {
      const isCanceled =
        err instanceof Error && /USER_CANCEL|user_cancel|취소/.test(err.message)
      if (!isCanceled) {
        const msg =
          err instanceof BusinessError
            ? err.message
            : err instanceof Error
            ? err.message
            : '결제를 시작하지 못했어요.'
        toast.error(msg)
      }
      setPaying(false)
    }
  }

  // 직접 입력 — 숫자만, 쉼표 자동 표기
  const handleCustomChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    setCustomInput(digits)
    const n = Number(digits)
    if (Number.isFinite(n) && n > 0) setAmount(n)
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">포인트 충전</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          취소
        </button>
      </div>

      {/* 금액 프리셋 */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => { setAmount(a); setCustomInput('') }}
            className={`py-3 rounded-xl text-sm font-medium border ${
              amount === a && !customInput
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 text-gray-700'
            }`}
          >
            {a.toLocaleString()}원
          </button>
        ))}
      </div>

      {/* 직접 입력 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">직접 입력</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={customInput ? Number(customInput).toLocaleString() : ''}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={`${MIN_AMOUNT.toLocaleString()} ~ ${MAX_AMOUNT.toLocaleString()}`}
            className="w-full h-11 rounded-xl border border-gray-300 px-4 pr-10 text-sm outline-none focus:border-primary-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          최소 {MIN_AMOUNT.toLocaleString()}원 / 1회 최대 {MAX_AMOUNT.toLocaleString()}원
        </p>
      </div>

      <div className="text-center">
        <p className="text-2xl font-bold text-primary-500">{amount.toLocaleString()}원</p>
        <p className="text-sm text-gray-400 mt-1">충전할 금액</p>
      </div>

      {/* 토스 결제수단 위젯 */}
      <div className="rounded-xl overflow-hidden">
        <div id="payment-method" />
        <div id="agreement" />
      </div>

      {widgetLoading && (
        <p className="text-center text-sm text-gray-400">결제 위젯 불러오는 중...</p>
      )}

      <Button
        fullWidth
        isLoading={paying}
        disabled={widgetLoading || !widget || amount < MIN_AMOUNT || amount > MAX_AMOUNT}
        onClick={handleCharge}
      >
        {amount.toLocaleString()}원 결제하기
      </Button>
    </div>
  )
}
