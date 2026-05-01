// 포인트 출금 페이지 컴포넌트: 사용자가 포인트를 출금 신청하는 페이지
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { useMutation, useQueryClient } from '@tanstack/react-query'  // React Query 훅들
import { useNavigate } from 'react-router-dom'  // React Router의 네비게이션 훅
import { toast } from 'sonner'  // 토스트 알림 라이브러리
import { paymentApi } from '@/features/payment/api'  // 결제 API
import { pointKeys } from '@/features/payment/keys'  // 포인트 관련 쿼리 키
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { Input } from '@/shared/ui/Input'  // 입력 필드 컴포넌트
import type { WithdrawRequest } from '@/features/payment/types'  // 출금 요청 타입

/**
 * 포인트 출금 페이지 컴포넌트
 * 
 * 기능:
 * - 출금 신청 폼 제출
 * - 폼 유효성 검사 (React Hook Form)
 * - 출금 API 호출 및 상태 관리
 * - 성공 시 잔액 정보 갱신 및 페이지 이동
 * - 에러 처리 및 사용자 피드백
 * 
 * 데이터 흐름:
 * 1. 사용자가 출금 정보 입력
 * 2. 폼 제출 시 출금 API 호출
 * 3. 성공 시 포인트 잔액 캐시 무효화
 * 4. 포인트 페이지로 리디렉션
 */
export default function WithdrawPage() {
  const navigate = useNavigate()  // 페이지 네비게이션 함수
  const qc = useQueryClient()     // React Query 클라이언트
  const { register, handleSubmit } = useForm<WithdrawRequest>()  // 폼 관리 훅

  // 출금 신청 뮤테이션: API 호출 및 상태 관리
  const { mutate, isPending } = useMutation({
    mutationFn: (body: WithdrawRequest) => paymentApi.withdraw(body),  // 출금 API 호출 함수
    onSuccess: () => {
      // 성공 시: 포인트 잔액 캐시 무효화하여 최신 정보 반영
      qc.invalidateQueries({ queryKey: pointKeys.balance() })
      toast.success('출금 신청이 완료됐어요.')  // 성공 메시지
      navigate('/point')  // 포인트 페이지로 이동
    },
    onError: () => toast.error('출금 신청에 실패했어요.'),  // 실패 시 에러 메시지
  })

  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 제목 */}
      <h1 className="text-xl font-bold">출금 신청</h1>
      
      {/* 출금 신청 폼 */}
      <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
        {/* 출금 금액 입력 필드 */}
        <Input 
          label="출금 금액" 
          type="number" 
          {...register('amount', { valueAsNumber: true })}  // 숫자 값으로 변환
        />
        
        {/* 은행 정보 입력 필드 */}
        <Input 
          label="은행" 
          {...register('bankCode')} 
          placeholder="은행 코드 (예: 004)" 
        />
        
        {/* 계좌번호 입력 필드 */}
        <Input 
          label="계좌번호" 
          {...register('accountNumber')} 
        />
        
        {/* 예금주 입력 필드 */}
        <Input 
          label="예금주" 
          {...register('accountHolder')} 
        />
        
        {/* 출금 신청 버튼 */}
        <Button 
          type="submit" 
          fullWidth 
          isLoading={isPending}
        >
          출금 신청
        </Button>
      </form>
    </div>
  )
}
