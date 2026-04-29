import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** MSW Service Worker 인스턴스 */
export const worker = setupWorker(...handlers)
