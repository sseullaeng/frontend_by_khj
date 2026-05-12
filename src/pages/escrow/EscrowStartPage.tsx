// 거래대행 시작 — 신청자 역할 / 수수료 부담 선택 후 link 발급 (외부 거래 전용)
//
// ⚠ 네비게이션 바의 [거래대행 신청] 은 EXTERNAL 거래 전용.
//   쓸랭 내부(INTERNAL) 거래대행은 채팅방 안 [거래대행 신청] 버튼으로만 시작.
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { escrowStartSchema, type EscrowStartRequest } from '@/features/escrow/types'
import { useCreateEscrowLink } from '@/features/escrow/hooks'
import { Button } from '@/shared/ui/Button'

const ROLE_OPTIONS = [
  { value: 'buyer'  as const, label: '구매자', desc: '상대방에게 물품을 구매합니다.' },
  { value: 'seller' as const, label: '판매자', desc: '상대방에게 물품을 판매합니다.' },
]

const FEE_OPTIONS = [
  { value: 'buyer'  as const, label: '구매자가 부담', desc: '수수료 전액을 구매자가 냅니다.' },
  { value: 'seller' as const, label: '판매자가 부담', desc: '수수료 전액을 판매자가 냅니다.' },
  { value: 'both'   as const, label: '반반 부담',     desc: '수수료를 구매자·판매자가 절반씩 냅니다.' },
]

export default function EscrowStartPage() {
  const navigate = useNavigate()
  const create = useCreateEscrowLink()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<EscrowStartRequest>({
    resolver: zodResolver(escrowStartSchema),
    mode: 'onChange',
    defaultValues: { tradeMode: 'EXTERNAL' },   // 외부 거래 고정
  })

  const selectedRole = watch('role')
  const selectedFeePayer = watch('feePayer')

  const onSubmit = async (data: EscrowStartRequest) => {
    try {
      const link = await create.mutateAsync(data)
      // 발급된 linkToken 을 다음 페이지에 state 로 전달
      navigate('/escrow/apply/link', { state: { link } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '링크 생성에 실패했어요.')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      <h1 className="text-xl font-bold text-gray-900 mb-1">대행 신청 (외부 거래)</h1>
      <p className="text-sm text-gray-500 mb-8">
        쓸랭 외부(당근·번개장터 등) 거래에 대행 서비스를 신청해요.<br />
        내 역할과 수수료 부담 방식을 선택하면 상대방에게 공유할 링크가 생성됩니다.<br />
        <span className="text-xs text-gray-400">쓸랭 내 거래는 채팅방에서 [거래대행 신청] 버튼으로 시작해 주세요.</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {/* 역할 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">나는 어떤 역할인가요?</h2>
          <div className="flex flex-col gap-3">
            {ROLE_OPTIONS.map(({ value, label, desc }) => (
              <label key={value} className="block cursor-pointer">
                <input type="radio" value={value} {...register('role')} className="sr-only" />
                <div className={`p-4 rounded-xl border-2 transition-colors ${selectedRole === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.role && <p className="text-xs text-red-500 mt-2">{errors.role.message}</p>}
        </div>

        {/* 수수료 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">대행 수수료는 누가 부담하나요?</h2>
          <div className="flex flex-col gap-3">
            {FEE_OPTIONS.map(({ value, label, desc }) => (
              <label key={value} className="block cursor-pointer">
                <input type="radio" value={value} {...register('feePayer')} className="sr-only" />
                <div className={`p-4 rounded-xl border-2 transition-colors ${selectedFeePayer === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.feePayer && <p className="text-xs text-red-500 mt-2">{errors.feePayer.message}</p>}
        </div>

        {/* tradeMode 는 EXTERNAL 고정 — UI 노출 안 함 (hidden register 로만 schema 통과) */}
        <input type="hidden" {...register('tradeMode')} value="EXTERNAL" />

        {selectedRole && selectedFeePayer && (
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium text-blue-900 mb-1">선택 내용 확인</p>
            <p>역할: {ROLE_OPTIONS.find(o => o.value === selectedRole)?.label}</p>
            <p>수수료: {FEE_OPTIONS.find(o => o.value === selectedFeePayer)?.label}</p>
            <p>거래: 외부 플랫폼 (당근·번개장터 등)</p>
            <p className="mt-2 text-blue-700">확인 후 링크를 생성해 상대방에게 공유하세요.</p>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <Button type="submit" fullWidth disabled={!isValid || create.isPending} isLoading={create.isPending}>
              링크 생성하기
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
