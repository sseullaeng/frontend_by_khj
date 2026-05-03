// STOMP 자동 연결 관리 — 로그인 시 connect, 로그아웃 시 disconnect
// + 알림 실시간 스트림 글로벌 구독
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { connectStomp, disconnectStomp } from '@/shared/lib/stomp'
import { useNotificationStream } from '@/features/notification/hooks'

export default function StompProvider() {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (userId) {
      connectStomp()
      return () => disconnectStomp()
    }
  }, [userId])

  // 로그인 상태일 때만 알림 스트림 활성화
  return userId ? <NotificationListener /> : null
}

function NotificationListener() {
  useNotificationStream()
  return null
}
