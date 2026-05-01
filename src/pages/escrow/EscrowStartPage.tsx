// 에스크로 시작 페이지 컴포넌트: 에스크로 서비스 시작 및 기본 정보 입력
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { escrowStartSchema, type EscrowStartRequest } from '@/features/escrow/types'  // 에스크로 관련 타입
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트

// 역할 옵션: 사용자 역할 선택 옵션
const ROLE_OPTIONS = [
  {
    value: 'buyer' as const,  // 구매자 역할
    label: '구매자',          // 역할 라벨
    desc: '상대방에게 물품을 구매합니다.',  // 역할 설명
  },
  {
    value: 'seller' as const, // 판매자 역할
    label: '판매자',          // 역할 라벨
    desc: '상대방에게 물품을 판매합니다.',  // 역할 설명
  },
]

// 수수료 부담 옵션: 수수료 부담 방식 선택 옵션
const FEE_OPTIONS = [
  {
    value: 'buyer' as const,  // 구매자 부담
    label: '구매자가 부담',  // 부담 방식 라벨
    desc: '수수료 전액을 구매자가 냅니다.',  // 부담 방식 설명
  },
  {
    value: 'seller' as const, // 판매자 부담
    label: '판매자가 부담',  // 부담 방식 라벨
    desc: '수수료 전액을 판매자가 냅니다.',  // 부담 방식 설명
  },
  {
    value: 'both' as const,
    label: '반반 부담',
    desc: '수수료를 구매자·판매자가 절반씩 냅니다.',
  },
]

export default function EscrowStartPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<EscrowStartRequest>({
    resolver: zodResolver(escrowStartSchema),
    mode: 'onChange',
  })

  const selectedRole = watch('role')
  const selectedFeePayer = watch('feePayer')

  const onSubmit = (data: EscrowStartRequest) => {
    // TODO: API 연동 — 링크 생성 후 linkId를 쿼리로 전달
    console.log('escrow start:', data)
    navigate('/escrow/apply/link')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      <h1 className="text-xl font-bold text-gray-900 mb-1">대행 신청</h1>
      <p className="text-sm text-gray-500 mb-8">
        내 역할과 수수료 부담 방식을 선택하면 상대방에게 공유할 링크가 생성됩니다.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {/* 역할 선택 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">나는 어떤 역할인가요?</h2>
          <div className="flex flex-col gap-3">
            {ROLE_OPTIONS.map(({ value, label, desc }) => (
              <label key={value} className="block cursor-pointer">
                <input type="radio" value={value} {...register('role')} className="sr-only" />
                <div className={`p-4 rounded-xl border-2 transition-colors ${
                  selectedRole === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedRole === value ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {selectedRole === value && (
                        <div className="w-3 h-3 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.role && <p className="text-xs text-red-500 mt-2">{errors.role.message}</p>}
        </div>

        {/* 수수료 부담 선택 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">대행 수수료는 누가 부담하나요?</h2>
          <div className="flex flex-col gap-3">
            {FEE_OPTIONS.map(({ value, label, desc }) => (
              <label key={value} className="block cursor-pointer">
                <input type="radio" value={value} {...register('feePayer')} className="sr-only" />
                <div className={`p-4 rounded-xl border-2 transition-colors ${
                  selectedFeePayer === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedFeePayer === value ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {selectedFeePayer === value && (
                        <div className="w-3 h-3 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.feePayer && <p className="text-xs text-red-500 mt-2">{errors.feePayer.message}</p>}
        </div>

        {/* 선택 요약 */}
        {selectedRole && selectedFeePayer && (
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium text-blue-900 mb-1">선택 내용 확인</p>
            <p>역할: {ROLE_OPTIONS.find(o => o.value === selectedRole)?.label}</p>
            <p>수수료: {FEE_OPTIONS.find(o => o.value === selectedFeePayer)?.label}</p>
            <p className="mt-2 text-blue-700">확인 후 링크를 생성해 상대방에게 공유하세요.</p>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <Button type="submit" fullWidth disabled={!isValid}>
              링크 생성하기
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
