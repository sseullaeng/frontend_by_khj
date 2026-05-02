// 토스 결제 완료 콜백 페이지 — 백엔드 spec 정합
//
// success: ?paymentKey=&orderId=&amount= → POST /api/v1/payments/charge/confirm
// fail   : ?code=&message=&orderId=     → 백엔드 호출 X (5분 reconciliation 자동 정리)

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { paymentApi } from '@/features/payment/api'
import { pointKeys } from '@/features/payment/keys'
import { BusinessError } from '@/shared/types'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'

type Status = 'pending' | 'success' | 'error'

export default function ChargeCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const ranOnce = useRef(false)

  const [status, setStatus] = useState<Status>('pending')
  const [errorMsg, setErrorMsg] = useState('')
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true

    // Toss fail redirect 케이스 — 백엔드 호출 X
    const failCode = params.get('code')
    const failMsg = params.get('message')
    if (failCode) {
      setStatus('error')
      setErrorMsg(
        failCode === 'PAY_PROCESS_CANCELED'
          ? '결제가 취소되었어요.'
          : failMsg ?? '결제에 실패했어요.',
      )
      return
    }

    // success 케이스
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amountParam = Number(params.get('amount'))

    if (!paymentKey || !orderId || !amountParam) {
      setStatus('error')
      setErrorMsg('결제 정보가 올바르지 않아요.')
      return
    }
    setAmount(amountParam)

    paymentApi
      .confirmPayment({ paymentKey, orderId, amount: amountParam })
      .then(() => {
        // /me 응답의 pointBalance 갱신용
        qc.invalidateQueries({ queryKey: ['auth', 'me'] })
        qc.invalidateQueries({ queryKey: pointKeys.history() })
        setStatus('success')
        toast.success(`${amountParam.toLocaleString()}원 충전 완료!`)
      })
      .catch((err) => {
        setStatus('error')
        if (err instanceof BusinessError) {
          if (err.code === 'PAYMENT_AMOUNT_MISMATCH') {
            setErrorMsg('결제 금액이 일치하지 않아요. 고객센터로 문의해 주세요.')
          } else if (err.code === 'PAYMENT_DUPLICATED') {
            setErrorMsg('이미 처리된 결제예요.')
          } else if (err.code === 'EXTERNAL_API_ERROR') {
            setErrorMsg('결제 검증 중 일시적 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
          } else {
            setErrorMsg(err.message)
          }
        } else {
          setErrorMsg('결제 확정에 실패했어요.')
        }
      })
  }, [params, qc])

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {status === 'pending' && (
          <>
            <Loader2 size={48} className="text-primary-500 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900">결제 처리 중...</h1>
            <p className="text-sm text-gray-500">잠시만 기다려 주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-emerald-500" />
            <h1 className="text-xl font-bold text-gray-900">충전 완료</h1>
            <p className="text-sm text-gray-500">
              {amount.toLocaleString()}원이 포인트로 충전됐어요.
            </p>
            <Button fullWidth onClick={() => navigate('/point', { replace: true })}>
              포인트 페이지로
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-500" />
            <h1 className="text-xl font-bold text-gray-900">결제 실패</h1>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <Button fullWidth onClick={() => navigate('/point/charge', { replace: true })}>
              다시 시도
            </Button>
            <button
              onClick={() => navigate('/point', { replace: true })}
              className="text-sm text-gray-400 underline"
            >
              포인트 페이지로
            </button>
          </>
        )}
      </div>
    </div>
  )
}
