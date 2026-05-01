// 인기 아이템 배지 컴포넌트: 인기 상품임을 시각적으로 표시하는 배지
import { Sparkles } from 'lucide-react'  // 반짝이 아이콘

// 인기 아이템 배지 Props 인터페이스
interface HotItemBadgeProps {
  className?: string  // 추가 CSS 클래스 (선택사항)
}

/**
 * 인기 아이템 배지 컴포넌트
 * 인기 상품이나 인기 콘텐츠임을 시각적으로 강조하는 배지입니다.
 * 
 * 기능:
 * - 그라데이션 배경 (빨간색 → 주황색)
 * - 반짝이 아이콘과 "HOT" 텍스트
 * - 펄스 애니메이션 효과로 눈길 끌기
 * - 둥근 모서리 디자인
 * - 인라인 flexbox로 다른 요소와 자연스럽게 배치
 * 
 * 사용법:
 * <HotItemBadge />
 * 
 * <div>
 *   <h3>상품 제목 <HotItemBadge /></h3>
 * </div>
 */
export default function HotItemBadge({ className = '' }: HotItemBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full ${className}`}
    >
      {/* 반짝이 아이콘: 펄스 애니메이션으로 깜빡임 효과 */}
      <Sparkles size={12} className="animate-pulse" />
      
      {/* HOT 텍스트: 펄스 애니메이션으로 아이콘과 동기화 */}
      <span className="animate-pulse">HOT</span>
    </div>
  )
}
