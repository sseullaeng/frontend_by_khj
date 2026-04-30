/**
 * 포인트 충전 페이지 (토스 결제 위젯)
 *
 * 흐름:
 * 1. POST /api/v1/payments/charge { amount }
 * 2. 토스 위젯 SDK 렌더링
 * 3. 결제 완료 → ChargeCallbackPage로 redirect
 */
import { useState } from 'react'
import { paymentApi } from '@/features/payment/api'
import { Button } from '@/shared/ui/Button'
import { toast } from 'sonner'

const AMOUNTS = [1_000, 5_000, 10_000, 30_000, 50_000, 100_000]

export default function ChargePage() {
  const [amount, setAmount] = useState(10_000)
  const [isLoading, setIsLoading] = useState(false)

  const handleCharge = async () => {
    setIsLoading(true)
    try {
      await paymentApi.initCharge(amount)
      // TODO: 토스 위젯 SDK 초기화 + 결제 요청
      // const paymentWidget = await loadPaymentWidget(import.meta.env.VITE_TOSS_CLIENT_KEY, data.customerKey)
      // await paymentWidget.requestPayment({ ... })
      toast.info('토스 결제 위젯 연동 예정 (D7)')
    } catch {
      toast.error('충전 초기화에 실패했어요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">포인트 충전</h1>

      <div className="grid grid-cols-3 gap-2">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setAmount(a)}
            className={`py-3 rounded-xl text-sm font-medium border ${
              amount === a
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 text-gray-700'
            }`}
          >
            {a.toLocaleString()}원
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-2xl font-bold text-primary-500">{amount.toLocaleString()}원</p>
        <p className="text-sm text-gray-400 mt-1">충전할 금액</p>
      </div>

      <Button fullWidth isLoading={isLoading} onClick={handleCharge}>
        결제하기
      </Button>
    </div>
  )
}
