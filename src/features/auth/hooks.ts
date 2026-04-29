import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from './api'
import { useAuthStore } from './store'
import { getErrorMessage } from '@/shared/lib/errorMessages'
import { BusinessError } from '@/shared/types'
import type { LoginRequest, SignupRequest } from './types'

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

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then((r) => r.data),
    onSuccess: setUser,
    retry: false,
  })
}
