// 출금 신청 페이지 — 백엔드 spec 정합
// POST /api/v1/withdrawals { idempotencyKey, amount, bankName, accountNumber, accountHolder }
// - bankName: 자유 문자열 (한국 은행명, "신한"/"국민"/...)
// - 잔액 부족 시 즉시 차단 (백엔드 신청 시점 검증)
// - idempotencyKey: 클라가 발급, 같은 키 재호출은 기존 신청 ID 그대로 반환

import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { withdrawalApi } from '@/features/payment/api'
import { withdrawalKeys } from '@/features/payment/keys'
import { useAuthStore } from '@/features/auth/store'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { BusinessError } from '@/shared/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import type { WithdrawRequest } from '@/features/payment/types'

const BANKS = [
  '신한', '국민', '우리', '하나', '농협', 'IBK기업', 'SC제일', '카카오뱅크',
  '토스뱅크', '케이뱅크', '대구', '부산', '광주', '경남', '제주', '새마을금고', '우체국',
]

type FormValues = Omit<WithdrawRequest, 'idempotencyKey'>

export default function WithdrawPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { isVerified } = useEmailGuard()
  const balance = user?.pointBalance ?? 0

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    defaultValues: { amount: 0, bankName: BANKS[0], accountNumber: '', accountHolder: '' },
  })
  const amountWatch = Number(watch('amount') || 0)

  const { mutate, isPending } = useMutation({
    mutationFn: (body: WithdrawRequest) => withdrawalApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })       // pointBalance 갱신
      qc.invalidateQueries({ queryKey: withdrawalKeys.all() }) // 출금 목록 갱신
      toast.success('출금 신청이 완료됐어요.')
      navigate('/point')
    },
    onError: (err) => {
      if (err instanceof BusinessError) {
        if (err.code === 'INSUFFICIENT_POINT') toast.error('포인트가 부족해요.')
        else toast.error(err.message)
      } else {
        toast.error('출금 신청에 실패했어요.')
      }
    },
  })

  const onSubmit = (data: FormValues) => {
    if (!isVerified) {
      toast.error('이메일 인증 후 출금할 수 있어요.')
      return
    }
    if (data.amount <= 0) {
      toast.error('출금 금액을 입력해 주세요.')
      return
    }
    if (data.amount > balance) {
      toast.error('보유 잔액보다 많이 출금할 수 없어요.')
      return
    }
    if (!data.bankName || !data.accountNumber || !data.accountHolder) {
      toast.error('은행 정보를 모두 입력해 주세요.')
      return
    }

    mutate({ ...data, idempotencyKey: crypto.randomUUID() })
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="text-xl font-bold">출금 신청</h1>

      {/* 잔액 표시 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-600">보유 포인트</span>
        <span className="font-bold text-primary-500">{balance.toLocaleString()}원</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="출금 금액"
          type="number"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true, min: 1 })}
        />
        {amountWatch > balance && (
          <p className="text-xs text-red-500 -mt-2">잔액 초과</p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">은행</label>
          <select
            {...register('bankName')}
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
          >
            {BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <Input label="계좌번호" placeholder="'-' 없이 숫자만" {...register('accountNumber')} />
        <Input label="예금주" {...register('accountHolder')} />

        <Button
          type="submit"
          fullWidth
          isLoading={isPending}
          disabled={!isVerified || amountWatch <= 0 || amountWatch > balance}
        >
          {isVerified ? '출금 신청' : '이메일 인증 후 가능'}
        </Button>
      </form>
    </div>
  )
}
