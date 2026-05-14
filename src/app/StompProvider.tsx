// STOMP 자동 연결 관리 — 로그인 시 connect, 로그아웃 시 disconnect
// + 알림 실시간 스트림 글로벌 구독
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { connectStomp, disconnectStomp } from '@/shared/lib/stomp'
import { useNotificationStream } from '@/features/notification/hooks'

export default function StompProvider() {
  const userId = useAuthStore((s) => s.user?.id)
  const [stompStarted, setStompStarted] = useState(false)

  useEffect(() => {
    setStompStarted(false)
    if (userId) {
      connectStomp()
      setStompStarted(true)
      return () => {
        setStompStarted(false)
        disconnectStomp()
      }
    }
  }, [userId])

  // connectStomp() 로 client 를 만든 다음 렌더에서 구독해야 초기 구독 누락을 피한다.
  return userId && stompStarted ? <NotificationListener /> : null
}

function NotificationListener() {
  useNotificationStream()
  return null
}
