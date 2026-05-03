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
      const msg =
        err instanceof BusinessError
          ? getErrorMessage(err.code)
          : '회원가입에 실패했어요.'
      toast.error(msg)
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
