import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/shared/types'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

// 개발 단계용 샘플 유저
const sampleUser: User = {
  id: 1,
  email: 'test@example.com',
  nickname: '테스트유저',
  profileImageUrl: null,
  trustScore: 85,
  role: 'USER',
  createdAt: '2024-04-01T00:00:00Z'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 개발 단계에서는 샘플 유저로 자동 로그인
      user: import.meta.env.DEV ? sampleUser : null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
      // 토큰은 저장 안 함 — user 정보만 persist
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// auth:logout 이벤트 수신 (axios 인터셉터에서 dispatch)
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout()
  window.location.href = '/login'
})
