import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from './api'
import { useAuthStore } from './store'
import { getErrorMessage } from '@/shared/lib/errorMessages'
import { BusinessError } from '@/shared/types'
import type { LoginRequest, SignupRequest, UpdateProfileRequest } from './types'

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body).then((r) => r.data),
    onSuccess: (data) => {
      setUser(data.user)
      navigate('/')
    },
    onError: (err) => {
      const msg =
        err instanceof BusinessError
          ? getErrorMessage(err.code)
          : '로그인에 실패했어요.'
      toast.error(msg)
    },
  })
}

export function useSignup() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
    onSuccess: () => {
      toast.success('가입 완료! 로그인해 주세요.')
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
