import api from '@/shared/api/axios'
import type { LoginRequest, SignupRequest, LoginResponse } from './types'
import type { User } from '@/shared/types'

export const authApi = {
  login:   (body: LoginRequest)  => api.post<LoginResponse>('/api/v1/auth/login', body),
  signup:  (body: SignupRequest) => api.post<void>('/api/v1/auth/signup', body),
  logout:  ()                    => api.post<void>('/api/v1/auth/logout'),
  refresh: ()                    => api.post<void>('/api/v1/auth/refresh'),
  me:      ()                    => api.get<User>('/api/v1/auth/me'),

  // 소셜 로그인: 백엔드 redirect → 콜백 URL에서 user 정보 조회
  socialCallback: (code: string, provider: 'kakao' | 'naver') =>
    api.get<LoginResponse>(`/api/v1/auth/oauth/${provider}/callback`, { params: { code } }),
}
