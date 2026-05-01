// 회원가입 페이지 컴포넌트: 신규 사용자 등록 처리 기능 제공
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { signupSchema, type SignupRequest } from '@/features/auth/types'  // 인증 관련 타입
import { useSignup } from '@/features/auth/hooks'  // 회원가입 훅
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { Input } from '@/shared/ui/Input'  // 입력 필드 컴포넌트

/**
 * 회원가입 페이지 컴포넌트
 * 
 * 기능:
 * - 신규 사용자 계정 생성
 * - 폼 유효성 검증 (Zod 스키마)
 * - 이메일 중복 확인
 * - 비밀번호 강도 검증
 * - 회원가입 API 호출
 * - 로그인 페이지로 이동
 * 
 * UI 구조:
 * - 상단: 페이지 제목
 * - 중단: 회원가입 폼 (이메일, 닉네임, 비밀번호, 비밀번호 확인)
 * - 하단: 로그인 링크
 */
export default function SignupPage() {
  const { mutate: signup, isPending } = useSignup()  // 회원가입 뮤테이션 훅
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupRequest>({ resolver: zodResolver(signupSchema) })  // 폼 상태 관리

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        {/* 페이지 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">회원가입</h1>

        {/* 회원가입 폼 */}
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
