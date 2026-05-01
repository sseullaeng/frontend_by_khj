// 포인트 충전 페이지 컴포넌트: 토스페이먼츠 결제 위젯을 통해 포인트를 충전하는 페이지
/**
 * 포인트 충전 페이지 (토스 결제 위젯 연동)
 * 
 * 결제 흐름:
 * 1. POST /api/v1/payments/charge { amount } - 결제 초기화 API 호출
 * 2. 토스 위젯 SDK 렌더링 - 결제창 표시
 * 3. 결제 완료 → ChargeCallbackPage로 redirect - 콜백 페이지로 이동
 * 
 * 기능:
 * - 충전 금액 선택 (미리 정의된 금액 또는 직접 입력)
 * - 토스페이먼츠 결제 위젯 연동
 * - 결제 초기화 및 상태 관리
 * - 에러 처리 및 사용자 피드백
 */
import { useState } from 'react'  // React 상태 훅
import { paymentApi } from '@/features/payment/api'  // 결제 API
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { toast } from 'sonner'  // 토스트 알림 라이브러리

// 충전 금액 옵션: 사용자가 선택할 수 있는 미리 정의된 금액들
const AMOUNTS = [1_000, 5_000, 10_000, 30_000, 50_000, 100_000]

export default function ChargePage() {
  // 충전 금액 상태 (기본값: 10,000원)
  const [amount, setAmount] = useState(10_000)
  
  // 로딩 상태: 결제 처리 중인지 여부
  const [isLoading, setIsLoading] = useState(false)

  // 포인트 충전 처리 함수
  const handleCharge = async () => {
    setIsLoading(true)  // 로딩 상태 시작
    
    try {
      // 결제 초기화 API 호출
      await paymentApi.initCharge(amount)
      
      // TODO: 토스 위젯 SDK 초기화 + 결제 요청 (향후 구현 예정)
      // const paymentWidget = await loadPaymentWidget(import.meta.env.VITE_TOSS_CLIENT_KEY, data.customerKey)
      // await paymentWidget.requestPayment({ ... })
      
      // 현재는 임시 메시지 표시
      toast.info('토스 결제 위젯 연동 예정 (D7)')
    } catch {
      // 결제 초기화 실패 시 에러 메시지 표시
      toast.error('충전 초기화에 실패했어요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">포인트 충전</h1>

      {/* 금액 선택 버튼 */}
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

      {/* 선택된 금액 표시 */}
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
