// 무한 스크롤 훅: IntersectionObserver API를 사용한 스크롤 기반 데이터 로딩
import { useEffect, useRef } from 'react'  // React 이펙트 및 레퍼런스 훅

// 무한 스크롤 훅 옵션 인터페이스
interface UseInfiniteScrollOptions {
  onIntersect: () => void   // 감시 요소가 뷰포트에 진입했을 때 실행할 콜백 함수
  enabled?: boolean         // 무한 스크롤 활성화 여부 (기본값: true)
  threshold?: number       // 교차 감지 임계값 (0-1, 기본값: 0.1)
}

/**
 * IntersectionObserver 기반 무한 스크롤 훅
 * 리스트의 마지막 아이템에 ref를 연결하여 뷰포트에 진입하면 다음 데이터를 로드합니다.
 * 
 * @param options - 무한 스크롤 설정 옵션
 * @returns 감시 요소에 연결할 ref 객체
 * 
 * @example
 * const sentinelRef = useInfiniteScroll({
 *   onIntersect: () => loadMoreItems(),
 *   enabled: hasMoreItems,
 *   threshold: 0.1
 * });
 * 
 * // JSX에서 사용:
 * {items.map(item => <Item key={item.id} data={item} />)}
 * <div ref={sentinelRef} />  // 이 요소가 뷰포트에 들어오면 다음 데이터 로드
 */
export function useInfiniteScroll({
  onIntersect,
  enabled = true,
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  // 감시 요소를 참조할 ref (리스트 마지막에 위치할 sentinel 요소)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // 무한 스크롤이 비활성화되거나 감시 요소가 없으면 종료
    if (!enabled || !sentinelRef.current) return

    // IntersectionObserver 생성: 요소가 뷰포트에 진입하는지 감지
    const observer = new IntersectionObserver(
      (entries) => {
        // 첫 번째 감시 요소가 뷰포트와 교차하면 콜백 실행
        if (entries[0].isIntersecting) onIntersect()
      },
      { threshold }  // 교차 감지 임계값 설정
    )

    // 감시 요소 관찰 시작
    observer.observe(sentinelRef.current)
    
    // 컴포넌트 언마운트 시 관찰 해제 (메모리 누수 방지)
    return () => observer.disconnect()
  }, [enabled, onIntersect, threshold])  // 옵션 변경 시 이펙트 재실행

  return sentinelRef  // 감시 요소에 연결할 ref 반환
}
