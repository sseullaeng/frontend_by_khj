import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind 조건부 클래스 헬퍼
 * clsx로 조건 처리 후 tailwind-merge로 충돌 클래스 제거
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', 'bg-gray-100')
 * // isActive=true → 'px-4 py-2 bg-primary-500'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
