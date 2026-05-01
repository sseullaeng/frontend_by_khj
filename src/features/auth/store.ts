// 인증 상태 스토어: 사용자 인증 정보 관리 (Zustand)
import { create } from 'zustand'  // Zustand 상태 관리 라이브러리
import { persist } from 'zustand/middleware'  // Zustand 영속성 미들웨어
import type { User } from '@/shared/types'  // 사용자 타입

// 인증 상태 인터페이스
interface AuthState {
  user: User | null                    // 현재 로그인된 사용자 정보
  setUser: (user: User | null) => void  // 사용자 정보 설정 함수
  logout: () => void                    // 로그아웃 함수
}

/**
 * 인증 상태 스토어
 * 
 * 기능:
 * - 사용자 정보 저장 및 관리
 * - 로그인/로그아웃 상태 관리
 * - 로컬 스토리지 영속화
 * - 전역 로그아웃 이벤트 처리
 * 
 * 특징:
 * - Zustand를 통한 상태 관리
 * - persist 미들웨어로 로컬 스토리지 저장
 * - axios 인터셉터와 연동된 로그아웃 처리
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,                    // 초기 상태: 로그아웃
      setUser: (user) => set({ user }),  // 사용자 정보 설정
      logout: () => set({ user: null }),  // 로그아웃 처리
    }),
    {
      name: 'auth-storage',  // 로컬 스토리지 키
      partialize: (state) => ({ user: state.user }),  // 사용자 정보만 영속화
    }
  )
)

// 전역 로그아웃 이벤트 리스너 (axios 인터셉터에서 dispatch)
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout()  // 스토어 로그아웃 처리
  window.location.href = '/login'  // 로그인 페이지로 리다이렉트
})
