// 관리자 로그인 — 가이드 §11.1
//
// ⚠️ 일반 사용자 AT/RT 와 분리. 같은 브라우저에서 관리자/일반 동시 접속 불가 (쿠키 덮어씀).
import { useForm } from 'react-hook-form'
import { useAdminLogin } from '@/features/admin/hooks'
import type { AdminLoginRequest } from '@/features/admin/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { ShieldAlert } from 'lucide-react'

export default function AdminLoginPage() {
  const { mutate, isPending } = useAdminLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginRequest>()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldAlert className="text-primary-500" size={28} />
          <h1 className="text-2xl font-bold text-primary-500">쓸랭 관리자</h1>
        </div>
        <p className="text-xs text-gray-400 text-center mb-6">
          ROLE_ADMIN 전용 — 일반 계정과 동시 접속 불가
        </p>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
          <Input
            label="아이디"
            placeholder="admin"
            error={errors.username?.message}
            {...register('username', { required: '아이디를 입력해 주세요.' })}
          />
          <Input
            label="비밀번호"
            type="password"
            error={errors.password?.message}
            {...register('password', { required: '비밀번호를 입력해 주세요.' })}
          />
          <Button type="submit" fullWidth isLoading={isPending} className="mt-2">
            로그인
          </Button>
        </form>
      </div>
    </div>
  )
}
