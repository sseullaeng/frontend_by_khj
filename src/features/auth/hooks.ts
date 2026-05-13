// 인증 관련 훅: 로그인, 회원가입, 프로필 관리 등 인증 관련 상태 관리
import { useMutation, useQuery } from '@tanstack/react-query'  // React Query 훅
import { useEffect } from 'react'  // React 훅
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { toast } from 'sonner'  // 토스트 알림 라이브러리
import { authApi } from './api'  // 인증 API
import { useAuthStore } from './store'  // 인증 상태 스토어
import { getErrorMessage } from '@/shared/lib/errorMessages'  // 에러 메시지 유틸리티
import { BusinessError } from '@/shared/types'  // 비즈니스 에러 타입
import type {
  LoginRequest,
  SignupForm,
  UpdateProfileRequest,
  OAuthLoginRequest,
  SocialLinkPreviewRequest,
  SocialLinkConfirmRequest,
} from './types'  // 인증 관련 타입

/**
 * 로그인 훅
 * 
 * 기능:
 * - 로그인 API 호출
 * - 사용자 정보 저장
 * - 로그인 성공 시 홈으로 이동
 * - 에러 처리 및 토스트 알림
 */
export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)  // 사용자 정보 저장 함수
  const navigate = useNavigate()  // 페이지 네비게이션 함수

  return useMutation({
    // 가이드 §2.1: 로그인 응답 data 가 곧 사용자 정보 객체 (User schema)
    mutationFn: (body: LoginRequest) => authApi.login(body).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user)
      navigate('/')
    },
    onError: (err) => {
      const msg =
        err instanceof BusinessError
          ? getErrorMessage(err.code)  // 비즈니스 에러 메시지
          : '로그인에 실패했어요.'      // 기본 에러 메시지
      toast.error(msg)  // 에러 토스트 알림
    },
  })
}

/**
 * 소셜 로그인 훅 (KAKAO / GOOGLE)
 *
 * 흐름 (가이드 §5):
 * 1) 페이지에서 SDK로 access_token 획득 (loginWithKakao / loginWithGoogle)
 * 2) 이 훅으로 백엔드에 access_token 전달 → AT/RT 쿠키 발급
 * 3) 응답 data 가 곧 User
 */
export function useOAuthLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (req: OAuthLoginRequest) => authApi.oauthLogin(req).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user)
      navigate('/')
    },
    onError: (err) => {
      const msg =
        err instanceof BusinessError
          ? getErrorMessage(err.code)
          : '소셜 로그인에 실패했어요.'
      toast.error(msg)
    },
  })
}

export function useSignup() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password, nickname }: SignupForm) =>
      // passwordConfirm 은 프론트 검증 전용 — 서버에는 보내지 않음
      authApi.signup({ email, password, nickname }),
    onSuccess: () => {
      toast.success('가입 완료! 인증 메일을 확인해 주세요.')
      navigate('/login')
    },
    onError: (err) => {
      // 중복 이메일 등 — 특정 코드 매핑 우선, 없으면 백엔드 한글 메시지(err.message) 노출
      if (err instanceof BusinessError) {
        toast.error(getErrorMessage(err.code, err.message))
        return
      }
      toast.error('회원가입에 실패했어요.')
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => authApi.updateProfile(body).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user)
      toast.success('프로필이 수정됐어요!')
      navigate('/mypage')
    },
    onError: () => toast.error('프로필 수정에 실패했어요.'),
  })
}

// 이메일 인증 메일 재전송 — POST /api/v1/auth/resend-verification
//   429 AUTH_VERIFICATION_RESEND_TOO_SOON 시 사용자에게 안내
export function useResendVerification() {
  return useMutation({
    mutationFn: () => authApi.resendVerification(),
    onSuccess: () => toast.success('인증 메일을 다시 보냈어요. 메일함을 확인해 주세요.'),
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code))
      else toast.error('인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
    },
  })
}

// ── 라운드14: LOCAL ↔ OAuth 2-step 명시 연결 ────────────────────────────

/** (1) Preview — provider 토큰 교환 + 연결 가능 여부 검증, linkKey 발급 (5분 TTL) */
export function useSocialLinkPreview() {
  return useMutation({
    mutationFn: (req: SocialLinkPreviewRequest) =>
      authApi.socialLinkPreview(req).then((r) => r.data),
  })
}

/** (2) Confirm — linkKey 로 실제 연결 + 갱신된 user 반환 */
export function useSocialLinkConfirm() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (body: SocialLinkConfirmRequest) =>
      authApi.socialLinkConfirm(body).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user)
      toast.success('소셜 계정이 연결됐어요.')
    },
    onError: (err) => {
      if (err instanceof BusinessError) toast.error(getErrorMessage(err.code, err.message))
      else toast.error('소셜 계정 연결에 실패했어요.')
    },
  })
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then((r) => r.data),
    retry: false,
  })

  useEffect(() => {
    if (query.data) setUser(query.data)
  }, [query.data, setUser])

  return query
}
