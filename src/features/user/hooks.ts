import { useQuery } from '@tanstack/react-query'
import { userApi } from './api'

export function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: ['user', 'profile', userId],
    queryFn: () => userApi.getProfile(userId!).then((r) => r.data),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,  // 5분 — 자주 안 바뀌는 정보
  })
}
