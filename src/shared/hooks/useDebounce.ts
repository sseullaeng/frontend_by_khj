// 디바운스 훅: 값 변경이 멈춘 후 지정된 시간 동안 기다린 후 최신 값을 반환
import { useState, useEffect } from 'react'  // React 상태 및 이펙트 훅

/**
 * 디바운스 훅: 빈번한 값 변경을 방지하고 마지막 값만 처리
 * 검색 입력, 스크롤 이벤트 등 빈번한 이벤트 처리에 사용됩니다.
 * 
 * @param value - 디바운스할 값 (제네릭 타입 지원)
 * @param delayMs - 디바운스 지연 시간 (밀리초, 기본값 300ms)
 * @returns 디바운스된 값
 * 
 * @example
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * // searchTerm이 변경되면 500ms 후에 debouncedSearchTerm이 업데이트됨
 * // API 호출은 debouncedSearchTerm을 사용하여 불필요한 요청 방지
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  // 디바운스된 값을 저장할 상태
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 지정된 시간 후에 값을 업데이트하는 타이머 설정
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    
    // 컴포넌트 언마운트나 값 변경 시 이전 타이머 정리
    return () => clearTimeout(timer)
  }, [value, delayMs])  // value나 delayMs가 변경될 때마다 이펙트 재실행

  return debouncedValue
}
