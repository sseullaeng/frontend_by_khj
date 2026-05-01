// 로그인 페이지 컴포넌트: 사용자 인증 처리 및 로그인 기능 제공
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { loginSchema, type LoginRequest } from '@/features/auth/types'  // 인증 관련 타입
import { useLogin } from '@/features/auth/hooks'  // 로그인 훅
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { Input } from '@/shared/ui/Input'  // 입력 필드 컴포넌트

/**
 * 로그인 페이지 컴포넌트
 * 
 * 기능:
 * - 이메일/비밀번호 로그인
 * - 폼 유효성 검증 (Zod 스키마)
 * - 로그인 API 호출
 * - 소셜 로그인 연동
 * - 회원가입 페이지로 이동
 * - 비밀번호 찾기 기능
 * 
 * UI 구조:
 * - 상단: 서비스 로고
 * - 중단: 로그인 폼 (이메일, 비밀번호)
 * - 하단: 소셜 로그인 및 회원가입 링크
 */
export default function LoginPage() {
  const { mutate: login, isPending } = useLogin()  // 로그인 뮤테이션 훅
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginSchema) })  // 폼 상태 관리

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        {/* 서비스 로고 */}
        <h1 className="text-3xl font-bold text-primary-500 text-center mb-8">쓸랭</h1>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit((data) => login(data))} className="flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            placeholder="example@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해 주세요"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth isLoading={isPending} className="mt-2">
            로그인
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="text-primary-500 font-medium">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
