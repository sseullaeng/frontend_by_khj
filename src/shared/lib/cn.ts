// Tailwind CSS 클래스네임 유틸리티: 조건부 클래스와 충돌 해결을 위한 헬퍼 함수
import { clsx, type ClassValue } from 'clsx'      // 조건부 클래스 처리 라이브러리
import { twMerge } from 'tailwind-merge'         // Tailwind 클래스 충돌 해결 라이브러리

/**
 * Tailwind 조건부 클래스 헬퍼 함수
 * clsx로 조건부 클래스를 처리한 후, tailwind-merge로 중복되거나 충돌하는 클래스를 제거합니다.
 * 
 * 주로 동적으로 클래스를 조합할 때 사용되며, 동일한 속성의 클래스가 충돌하면 나중에 있는 클래스를 우선 적용합니다.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', 'bg-gray-100')
 * // isActive가 true이면: 'px-4 py-2 bg-primary-500' (bg-gray-100이 bg-primary-500으로 대체됨)
 * // isActive가 false이면: 'px-4 py-2 bg-gray-100'
 * 
 * @param inputs - clsx가 처리할 수 있는 모든 타입의 클래스 값들
 * @returns 충돌이 제거된 최종 클래스네임 문자열
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
