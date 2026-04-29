import { authHandlers }         from './auth.handlers'
import { itemHandlers }         from './item.handlers'
import { chatHandlers }         from './chat.handlers'
import { notificationHandlers } from './notification.handlers'

/**
 * 전체 MSW 핸들러 통합
 *
 * D11 실서버 전환 시: handlers 배열만 비워주면 됨 (코드 변경 0)
 * 또는 VITE_MSW_ENABLED=false 로 main.tsx에서 worker.start()를 건너뜀
 */
export const handlers = [
  ...authHandlers,
  ...itemHandlers,
  ...chatHandlers,
  ...notificationHandlers,
]
