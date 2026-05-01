// 포인트 충전 콜백 페이지 컴포넌트: 토스페이먼츠 결제 완료 후 처리 페이지
/**
 * 토스 결제 완료 콜백 페이지
 * 
 * 토스페이먼츠가 결제 완료 후 successUrl로 redirect할 때 도착하는 페이지입니다.
 * 
 * 처리 흐름:
 * 1. URL 파라미터에서 결제 정보 추출 (paymentKey, orderId, amount)
 * 2. 결제 정보 유효성 검증
 * 3. 백엔드에 결제 확정 요청
 * 4. 성공 시 포인트 잔액 캐시 갱신 및 포인트 페이지로 이동
 * 5. 실패 시 에러 처리
 */
import { useEffect } from 'react'  // React 이펙트 훅
import { useSearchParams, useNavigate } from 'react-router-dom'  // React Router 훅들
import { paymentApi } from '@/features/payment/api'  // 결제 API
import { useQueryClient } from '@tanstack/react-query'  // React Query 클라이언트
import { pointKeys } from '@/features/payment/keys'  // 포인트 관련 쿼리 키
import { toast } from 'sonner'  // 토스트 알림 라이브러리

export default function ChargeCallbackPage() {
  const [params] = useSearchParams()  // URL 쿼리 파라미터
  const navigate = useNavigate()      // 페이지 네비게이션 함수
  const qc = useQueryClient()         // React Query 클라이언트

  // 결제 콜백 처리 이펙트
  useEffect(() => {
    // URL 파라미터에서 결제 정보 추출
    const paymentKey = params.get('paymentKey')  // 토스 결제 키
    const orderId    = params.get('orderId')      // 주문 ID
    const amount     = Number(params.get('amount')) // 결제 금액

    // 결제 정보 유효성 검증
    if (!paymentKey || !orderId || !amount) {
      toast.error('결제 정보가 올바르지 않아요.')
      navigate('/point')
      return
    }

    // 백엔드에 결제 확정 요청
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
