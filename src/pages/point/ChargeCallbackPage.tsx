/**
 * 토스 결제 완료 콜백 페이지
 * 토스가 successUrl로 redirect할 때 도착하는 페이지
 */
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentApi } from '@/features/payment/api'
import { useQueryClient } from '@tanstack/react-query'
import { pointKeys } from '@/features/payment/keys'
import { toast } from 'sonner'

export default function ChargeCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId    = params.get('orderId')
    const amount     = Number(params.get('amount'))

    if (!paymentKey || !orderId || !amount) {
      toast.error('결제 정보가 올바르지 않아요.')
      navigate('/point')
      return
    }

    paymentApi
      .confirmCharge({ paymentKey, orderId, amount })
      .then(() => {
        qc.invalidateQueries({ queryKey: pointKeys.balance() })
        toast.success(`${amount.toLocaleString()}원 충전 완료!`)
        navigate('/point')
      })
      .catch(() => {
        toast.error('결제 확정에 실패했어요.')
        navigate('/point')
      })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">결제 처리 중...</p>
    </div>
  )
}
