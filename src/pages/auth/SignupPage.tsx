import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { signupSchema, type SignupRequest } from '@/features/auth/types'
import { useSignup } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export default function SignupPage() {
  const { mutate: signup, isPending } = useSignup()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupRequest>({ resolver: zodResolver(signupSchema) })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">회원가입</h1>

        <form onSubmit={handleSubmit((data) => signup(data))} className="flex flex-col gap-4">
          <Input label="이메일" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="닉네임" error={errors.nickname?.message} {...register('nickname')} />
          <Input
            label="비밀번호"
            type="password"
            helperText="8자 이상"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="비밀번호 확인"
            type="password"
            error={errors.passwordConfirm?.message}
            {...register('passwordConfirm')}
          />

          <Button type="submit" fullWidth isLoading={isPending} className="mt-2">
            가입하기
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-primary-500 font-medium">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
