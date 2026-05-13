// 클라이언트 측 정렬 유틸
import type { Item, ItemStatus } from './types'

const isCompleted = (s: ItemStatus): boolean => s === '거래완료'

/** 거래완료를 후순위로 (백엔드 정렬을 그대로 받은 뒤 거래완료만 끝으로 안정 정렬) */
export function sortCompletedLast<T extends Pick<Item, 'status'>>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(isCompleted(a.status)) - Number(isCompleted(b.status)))
}

/** 핫 아이템 정렬 — 관심 수 → 조회 수 → 최근 등록 시간 */
export function sortHotMultiKey<
  T extends Pick<Item, 'wishlistCount' | 'viewCount' | 'createdAt'>,
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (b.wishlistCount !== a.wishlistCount) return b.wishlistCount - a.wishlistCount
    if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
