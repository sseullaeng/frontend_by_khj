import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

/** ISO 문자열 → "방금 전", "5분 전" 등 상대 시간 */
export function fromNow(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: ko })
}

/** ISO 문자열 → "2026.04.28" */
export function toDateString(isoString: string): string {
  return format(parseISO(isoString), 'yyyy.MM.dd')
}

/** ISO 문자열 → "04.28 오후 03:25" */
export function toChatTimestamp(isoString: string): string {
  return format(parseISO(isoString), 'MM.dd a hh:mm', { locale: ko })
}
