// 날짜 포맷 유틸리티 — KST 일관성 헬퍼 + 표시 함수
//
// 백엔드는 KST naive LocalDateTime ("2026-05-03T10:00:00") 으로 응답.
// 그대로 new Date(...) 또는 parseISO() 에 넣으면 브라우저 로컬 시간대로 해석되어
// 해외(JST/UTC/PST 등) 사용자에게 시간이 어긋나 보일 수 있음.
// → 모든 timestamp 파싱은 parseKst 로 통과시켜서 KST 절대 시각 보장.
// → format 호출 시에도 toKstWallTime 으로 변환해 KST 벽시계 시각 표시.

import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 백엔드 LocalDateTime 을 KST 절대 시각으로 파싱.
 * - "2026-05-03T10:00:00"        → KST 10시
 * - "2026-05-03T10:00:00+09:00"  → 그대로 (이미 offset 있음)
 * - "2026-05-03T10:00:00Z"       → UTC 10시 (그대로 해석)
 *
 * 빈 문자열/null 등 잘못된 입력은 Invalid Date 반환.
 */
export function parseKst(iso: string | null | undefined): Date {
  if (!iso) return new Date(NaN)
  const hasOffset = /[+-]\d{2}:?\d{2}$/.test(iso) || iso.endsWith('Z')
  return new Date(hasOffset ? iso : iso + '+09:00')
}

/**
 * Date 를 KST 벽시계 시각이 로컬 메서드로 읽히는 형태로 변환.
 * date-fns format() 같이 로컬 시간대로 동작하는 포맷터에 통과시키면 KST 기준 표시.
 * (브라우저가 KST 라면 동일, 그 외 시간대에서도 일관된 KST 표시)
 */
function toKstWallTime(date: Date): Date {
  const KST_OFFSET_MIN = -540 // KST = UTC+9 → getTimezoneOffset() 기준 -540
  const diffMs = (date.getTimezoneOffset() - KST_OFFSET_MIN) * 60 * 1000
  return new Date(date.getTime() + diffMs)
}

/**
 * 절대 시각 기준 상대 시간. ("5분 전", "2시간 전", "3일 전")
 * 절대 시각만 비교하므로 wall-time 변환 불필요.
 */
export function fromNow(isoString: string): string {
  return formatDistanceToNow(parseKst(isoString), { addSuffix: true, locale: ko })
}

/**
 * "yyyy.MM.dd" — KST 기준 표시
 */
export function toDateString(isoString: string): string {
  return format(toKstWallTime(parseKst(isoString)), 'yyyy.MM.dd')
}

/**
 * "MM.dd a hh:mm" — 채팅 타임스탬프, KST 기준 표시
 */
export function toChatTimestamp(isoString: string): string {
  return format(toKstWallTime(parseKst(isoString)), 'MM.dd a hh:mm', { locale: ko })
}

/**
 * 임의의 패턴으로 KST 기준 표시.
 * @param pattern date-fns 포맷 패턴 (예: 'yyyy-MM-dd HH:mm')
 */
export function formatKst(isoString: string, pattern: string): string {
  return format(toKstWallTime(parseKst(isoString)), pattern, { locale: ko })
}
