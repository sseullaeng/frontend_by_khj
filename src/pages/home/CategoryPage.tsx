// 카테고리 페이지 컴포넌트: 특정 카테고리의 물품 목록을 무한 스크롤로 표시
import { useParams } from 'react-router-dom'  // URL 파라미터 추출 훅
import { useItemList } from '@/features/item/hooks'  // 물품 목록 조회 훅
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'  // 무한 스크롤 훅

/**
 * 카테고리 페이지 컴포넌트
 * 
 * 기능:
 * - URL 파라미터로 카테고리 식별
 * - 해당 카테고리의 물품 목록 표시
 * - 무한 스크롤로 추가 데이터 로드
 * - 2열 그리드 레이아웃으로 물품 표시
 * - 로딩 상태 및 에러 처리
 * 
 * 데이터 흐름:
 * 1. URL에서 카테고리 slug 추출
 * 2. 해당 카테고리 물품 목록 API 호출
 * 3. 무한 스크롤로 페이지네이션 처리
 * 4. 렌더링 시 모든 페이지 데이터 병합
 */
export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()  // URL 파라미터에서 카테고리 slug 추출
  
  // 해당 카테고리의 물품 목록 조회 (React Query 무한 쿼리)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useItemList({ category: slug })

  // 무한 스크롤을 위한 sentinel ref 설정
  const sentinelRef = useInfiniteScroll({
    onIntersect: () => { if (hasNextPage) fetchNextPage() },  // 다음 페이지 로드 트리거
    enabled: hasNextPage,  // 다음 페이지 존재 시에만 활성화
  })

  // 페이지네이션된 데이터에서 모든 물품 목록 추출 (모든 페이지 데이터 병합)
  const items = data?.pages.flatMap((p) => p.content) ?? []

  return (
    <div>
      {/* 페이지 제목: 현재 카테고리명 표시 */}
      <h1 className="text-lg font-bold mb-4">{slug}</h1>
      
      {/* 물품 목록: 2열 그리드로 표시 */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="h-48 bg-gray-100 rounded-xl">
            {/* TODO: ItemCard 컴포넌트로 교체 예정 */}
            {item.title}
          </div>
        ))}
      </div>
      
      {/* 무한 스크롤 감지 센티넬 ref */}
      <div ref={sentinelRef} className="h-4" />
      
      {/* 로딩 상태 표시 */}
      {isFetchingNextPage && <p className="text-center text-sm text-gray-400 py-2">불러오는 중...</p>}
    </div>
  )
}
