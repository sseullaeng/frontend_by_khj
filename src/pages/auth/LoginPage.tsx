// 로그인 페이지 컴포넌트: 사용자 인증 처리 및 로그인 기능 제공
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'  // React Hook Form 라이브러리
import { zodResolver } from '@hookform/resolvers/zod'  // Zod 리졸버
import { Link, useLocation, useNavigate } from 'react-router-dom'  // React Router
import { toast } from 'sonner'  // 토스트 알림
import { loginSchema, type LoginRequest } from '@/features/auth/types'  // 인증 관련 타입
import { useLogin } from '@/features/auth/hooks'  // 로그인 훅
import { loginWithGoogle } from '@/features/auth/oauth'  // 소셜 로그인 SDK (카카오는 미운영, 일단 제외)
import { useAuthStore } from '@/features/auth/store'
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
  const navigate = useNavigate()
  const location = useLocation()
  const isLoggedIn = useAuthStore((s) => !!s.user)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginSchema) })  // 폼 상태 관리

  // 라운드14 — 가드 redirect 시 location.state.next 로 들어옴.
  //   OAuth flow (페이지 이탈) 도 같이 처리하려면 sessionStorage 에도 저장.
  const stateNext = (location.state as { next?: string } | null)?.next
  const nextPath = stateNext ?? sessionStorage.getItem('postLoginNext') ?? '/'
  useEffect(() => {
    if (stateNext) sessionStorage.setItem('postLoginNext', stateNext)
  }, [stateNext])

  // 이미 로그인된 상태로 LoginPage 진입 시 즉시 next 로 이동
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.removeItem('postLoginNext')
      navigate(nextPath, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  // 구글 redirect 흐름 — 콜백은 SocialCallbackPage 가 처리.
  //   SocialCallbackPage 는 sessionStorage('postLoginNext') 를 읽어 복귀.
  //   (카카오는 일단 제외 — 디벨로퍼 앱 검수 통과 후 재활성화)
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

        {/* 소셜 로그인 — 원형 아이콘 버튼 가로 배치 */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span>SNS 계정으로 로그인</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleGoogle}
              aria-label="구글로 로그인"
              className="w-12 h-12 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <GoogleIcon />
            </button>
          </div>
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

// 구글 G 4색 로고 (공식 컬러)
function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.7 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
