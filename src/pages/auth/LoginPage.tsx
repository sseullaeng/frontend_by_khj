// 로그인 페이지 컴포넌트: 사용자 인증 처리 및 로그인 기능 제공
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { toast } from 'sonner'  // 토스트 알림
import { loginSchema, type LoginRequest } from '@/features/auth/types'  // 인증 관련 타입
import { useLogin } from '@/features/auth/hooks'  // 로그인 훅
import { loginWithKakao, loginWithGoogle } from '@/features/auth/oauth'  // 소셜 로그인 SDK
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

  // 카카오/구글 모두 redirect 흐름 — 페이지가 provider 로 이동, 콜백은 SocialCallbackPage 가 처리
  const handleKakao = () => {
    loginWithKakao().catch((err) => {
      toast.error(err instanceof Error ? err.message : '카카오 로그인에 실패했어요.')
    })
  }
  const handleGoogle = () => {
    loginWithGoogle().catch((err) => {
      toast.error(err instanceof Error ? err.message : '구글 로그인에 실패했어요.')
    })
  }

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

        {/* 소셜 로그인 */}
        <div className="mt-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            <span>SNS 계정으로 로그인</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleKakao}
            className="h-10 w-full rounded-lg bg-[#FEE500] text-sm font-medium text-[#3C1E1E] hover:opacity-90 transition-opacity"
          >
            카카오로 로그인
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            구글로 로그인
          </button>
        </div>

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
