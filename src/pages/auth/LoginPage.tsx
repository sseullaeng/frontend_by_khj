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
            className="h-10 w-full rounded-lg bg-[#FEE500] text-sm font-medium text-[#3C1E1E] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <KakaoIcon />
            카카오로 로그인
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <GoogleIcon />
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

// 카카오톡 풍선 아이콘 (브랜드 컬러 #3C1E1E 위에 currentColor)
function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C6.48 3 2 6.62 2 10.79c0 2.63 1.74 4.95 4.4 6.32-.16.59-.7 2.6-.83 3.07-.15.59.21.58.45.42.18-.12 2.85-1.94 4.05-2.76.6.07 1.21.11 1.83.11 5.52 0 10-3.61 10-7.16S17.52 3 12 3z" />
    </svg>
  )
}

// 구글 G 4색 로고 (공식 컬러)
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.7 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
