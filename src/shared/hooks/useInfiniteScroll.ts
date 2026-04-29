import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  onIntersect: () => void
  enabled?: boolean
  threshold?: number
}

/**
 * IntersectionObserver 기반 무한 스크롤 훅
 * 마지막 아이템 ref를 뷰포트에 연결
 */
export function useInfiniteScroll({
  onIntersect,
  enabled = true,
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect()
      },
      { threshold }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [enabled, onIntersect, threshold])

  return sentinelRef
}
