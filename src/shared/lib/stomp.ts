// 글로벌 STOMP 클라이언트 (가이드 §8 — SockJS, 쿠키 인증)
//
// 설계:
//   - 한 사용자 세션당 클라이언트 1개. App 마운트 시 connect, 로그아웃 시 disconnect.
//   - 페이지/컴포넌트는 subscribe / publish 헬퍼만 사용.
//   - AT 만료 → SECURITY 에러 → refresh 후 재연결 (axios 인터셉터가 별도 요청에서 refresh 처리)
//   - SockJS publish 시 X-XSRF-TOKEN 헤더 동봉 (가이드 §8.3)

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import api from '@/shared/api/axios'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws-stomp'

let client: Client | null = null
let connectStateListeners = new Set<(connected: boolean) => void>()
let connected = false

// XSRF 쿠키 읽기 — publish 시 헤더에 동봉
function readXsrfToken(): string | undefined {
  const row = document.cookie.split('; ').find((r) => r.startsWith('XSRF-TOKEN='))
  return row ? decodeURIComponent(row.split('=')[1]) : undefined
}

function emitState(state: boolean) {
  connected = state
  connectStateListeners.forEach((cb) => cb(state))
}

/**
 * STOMP 클라이언트 연결. 이미 연결되어 있으면 noop.
 * 로그인 직후 호출. 호출 자체는 비동기 (실제 연결은 백그라운드).
 */
export function connectStomp() {
  if (client?.active) return

  const c = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => emitState(true),
    onDisconnect: () => emitState(false),
    onWebSocketClose: () => emitState(false),
    onStompError: async (frame) => {
      // AT 만료 등 보안 에러 — refresh 시도 후 다시 연결
      const errMsg = frame.headers['message'] ?? ''
      if (errMsg.includes('AUTH') || errMsg.includes('SECURITY')) {
        try {
          await api.post('/api/v1/auth/refresh')
          // STOMP 가 자동 reconnectDelay 로 재연결 시도
        } catch {
          // refresh 실패 — axios 인터셉터가 logout 이벤트 발행
        }
      }
    },
  })
  c.activate()
  client = c
}

/**
 * 연결 종료. 로그아웃 시 호출.
 */
export function disconnectStomp() {
  client?.deactivate()
  client = null
  emitState(false)
}

/**
 * 구독. 현재 미연결이면 onConnect 후 자동 구독.
 * @returns unsubscribe 함수
 */
export function subscribeStomp(
  destination: string,
  callback: (msg: IMessage) => void,
): () => void {
  let sub: StompSubscription | null = null
  let cancelled = false

  const doSubscribe = () => {
    if (cancelled || !client?.active) return
    sub = client.subscribe(destination, callback)
  }

  if (client?.connected) {
    doSubscribe()
  } else if (client) {
    // 연결 완료 대기 후 구독
    const prev = client.onConnect
    client.onConnect = (frame) => {
      prev?.(frame)
      doSubscribe()
    }
  }

  return () => {
    cancelled = true
    sub?.unsubscribe()
    sub = null
  }
}

/**
 * 메시지 전송 (XSRF 헤더 동봉)
 */
export function publishStomp(destination: string, body: unknown) {
  if (!client?.connected) {
    console.warn('STOMP 미연결 상태 publish 시도', destination)
    return
  }
  const xsrf = readXsrfToken()
  client.publish({
    destination,
    body: JSON.stringify(body),
    headers: xsrf ? { 'X-XSRF-TOKEN': xsrf } : undefined,
  })
}

/**
 * 연결 상태 구독 (UI 표시용)
 */
export function subscribeConnectionState(cb: (connected: boolean) => void): () => void {
  connectStateListeners.add(cb)
  cb(connected)
  return () => {
    connectStateListeners.delete(cb)
  }
}

/** 현재 연결 여부 (단발 조회용) */
export function isStompConnected(): boolean {
  return connected
}
