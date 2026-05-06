// 거래대행 결제 콜백 — Toss successUrl/failUrl 처리
//
// 흐름:
//   Toss 결제창 → success: ?paymentKey=&orderId=&amount=
//                  fail   : ?code=&message=&orderId=
//   → POST /api/v1/payments/charge/confirm { paymentKey, orderId, amount, escrowApplicationId }
//   → 백엔드가 application.status 자동 갱신 (결제대기 → 결제완료, 양쪽 share 충족 시)
//
// applicationId 와 linkToken 은 sessionStorage 에 저장된 값에서 꺼냄.
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { paymentApi } from '@/features/payment/api'
import { BusinessError } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

const PENDING_KEY = 'escrow_payment_pending'

interface PendingEscrow {
  applicationId: number
  linkToken: string
}

type Status = 'pending' | 'success' | 'error'

export default function EscrowPaymentCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const ranOnce = useRef(false)

  const [status, setStatus] = useState<Status>('pending')
  const [errorMsg, setErrorMsg] = useState('')
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true

    const pendingRaw = sessionStorage.getItem(PENDING_KEY)
    const pending: PendingEscrow | null = pendingRaw ? JSON.parse(pendingRaw) : null
    sessionStorage.removeItem(PENDING_KEY)

    // Toss fail 케이스
    const failCode = params.get('code')
    const failMsg = params.get('message')
    if (failCode) {
      setStatus('error')
      setErrorMsg(
        failCode === 'PAY_PROCESS_CANCELED'
          ? '결제가 취소됐어요.'
          : failMsg ?? '결제에 실패했어요.',
      )
      return
    }

    // Toss success 케이스
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amountParam = Number(params.get('amount'))

    if (!paymentKey || !orderId || !amountParam || !pending) {
      setStatus('error')
      setErrorMsg('결제 정보가 올바르지 않아요.')
      return
    }
    setAmount(amountParam)

    paymentApi
      .confirmPayment({
        paymentKey,
        orderId,
        amount: amountParam,
        escrowApplicationId: pending.applicationId,
      })
      .then(() => {
        setStatus('success')
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(
          err instanceof BusinessError
            ? err.message
            : '결제 검증 중 오류가 발생했어요.',
        )
      })
  }, [params])

  const pending: PendingEscrow | null = (() => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()
  // ↑ 위에서 이미 remove 했으므로 보통 null. 화면 이동 시 query 의 linkId 사용.

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
      {status === 'pending' && (
        <>
          <Loader2 size={44} className="text-primary-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500">결제를 확인하고 있어요...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 size={64} className="text-green-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">결제 완료</h1>
          <p className="text-sm text-gray-500 mb-6">
            {amount.toLocaleString()}원 결제가 완료됐어요.<br />
            상대방의 결제도 완료되면 라이더 매칭이 시작돼요.
          </p>
          <Button fullWidth onClick={() => navigate('/escrow/list', { replace: true })}>
            신청 목록으로
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle size={64} className="text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" fullWidth onClick={() => navigate('/escrow/list', { replace: true })}>
              신청 목록
            </Button>
            <Button fullWidth onClick={() => navigate(pending ? `/escrow/join/${pending.linkToken}/payment` : '/escrow/list', { replace: true })}>
              다시 시도
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
