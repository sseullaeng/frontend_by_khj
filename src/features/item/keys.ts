// 물품 React Query 키 팩토리: 물품 관련 쿼리 키 관리
import type { ItemFilter } from './types'  // 물품 필터 타입

/**
 * React Query 키 팩토리
 * 
 * 기능:
 * - 물품 관련 쿼리 키 생성
 * - 캐시 무효화 대상 키 관리
 * - 계층적 키 구조 제공
 * 
 * 사용법:
 * - 쿼리 키는 계층 구조로 관리
 * - 무효화 시 상위 키를 사용하면 하위 키들도 무효화됨
 * - 필터링된 목록은 필터를 키에 포함
 */
export const itemKeys = {
  all:    ()               => ['items'] as const,  // 모든 물품 키
  lists:  ()               => [...itemKeys.all(), 'list'] as const,  // 목록 키들
  list:   (filter: ItemFilter) => [...itemKeys.lists(), filter] as const,  // 필터링된 목록 키
  detail: (id: number)     => [...itemKeys.all(), 'detail', id] as const,  // 상세 정보 키
  wished: ()               => [...itemKeys.all(), 'wished'] as const,  // 찜 목록 키
}
