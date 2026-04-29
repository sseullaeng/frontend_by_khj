import type { ItemFilter } from './types'

/** React Query 키 팩토리 — 무효화 시 이 키만 수정 */
export const itemKeys = {
  all:    ()               => ['items'] as const,
  lists:  ()               => [...itemKeys.all(), 'list'] as const,
  list:   (filter: ItemFilter) => [...itemKeys.lists(), filter] as const,
  detail: (id: number)     => [...itemKeys.all(), 'detail', id] as const,
  wished: ()               => [...itemKeys.all(), 'wished'] as const,
}
