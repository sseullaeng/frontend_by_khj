// 날짜 포맷 유틸리티: date-fns 라이브러리를 사용한 한국어 날짜 포맷 함수들
import { formatDistanceToNow, format, parseISO } from 'date-fns'  // 날짜 처리 라이브러리
import { ko } from 'date-fns/locale'                           // 한국어 로케일

/**
 * ISO 날짜 문자열을 상대 시간으로 변환
 * "방금 전", "5분 전", "2시간 전", "3일 전" 등으로 표시
 * 
 * @param isoString - ISO 8601 형식의 날짜 문자열
 * @returns 한국어 상대 시간 문자열
 * 
 * @example
 * fromNow('2023-04-28T10:30:00Z') // 현재 시간 기준으로 "2시간 전" 등
 */
export function fromNow(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: ko })
}

/**
 * ISO 날짜 문자열을 간단한 날짜 형식으로 변환
 * "2026.04.28" 형식으로 표시
 * 
 * @param isoString - ISO 8601 형식의 날짜 문자열
 * @returns "yyyy.MM.dd" 형식의 날짜 문자열
 * 
 * @example
 * toDateString('2023-04-28T10:30:00Z') // "2023.04.28"
 */
export function toDateString(isoString: string): string {
  return format(parseISO(isoString), 'yyyy.MM.dd')
}

/**
 * ISO 날짜 문자열을 채팅 타임스탬프 형식으로 변환
 * "04.28 오후 03:25" 형식으로 표시 (채팅 앱에서 주로 사용)
 * 
 * @param isoString - ISO 8601 형식의 날짜 문자열
 * @returns "MM.dd a hh:mm" 형식의 시간 문자열 (한국어 오전/오후)
 * 
 * @example
 * toChatTimestamp('2023-04-28T15:30:00Z') // "04.28 오후 03:25"
 */
export function toChatTimestamp(isoString: string): string {
  return format(parseISO(isoString), 'MM.dd a hh:mm', { locale: ko })
}
