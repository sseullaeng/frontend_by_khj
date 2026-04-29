import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { paymentApi } from '@/features/payment/api'
import { pointKeys } from '@/features/payment/keys'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import type { WithdrawRequest } from '@/features/payment/types'

export default function WithdrawPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm<WithdrawRequest>()

  const { mutate, isPending } = useMutation({
    mutationFn: (body: WithdrawRequest) => paymentApi.withdraw(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pointKeys.balance() })
      toast.success('출금 신청이 완료됐어요.')
      navigate('/point')
    },
    onError: () => toast.error('출금 신청에 실패했어요.'),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">출금 신청</h1>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
        <Input label="출금 금액" type="number" {...register('amount', { valueAsNumber: true })} />
        <Input label="은행" {...register('bankCode')} placeholder="은행 코드 (예: 004)" />
        <Input label="계좌번호" {...register('accountNumber')} />
        <Input label="예금주" {...register('accountHolder')} />
        <Button type="submit" fullWidth isLoading={isPending}>출금 신청</Button>
      </form>
    </div>
  )
}
