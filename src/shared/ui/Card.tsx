// 카드 컴포넌트: 콘텐츠를 담는 재사용 가능한 카드 컨테이너
import { type HTMLAttributes } from 'react'  // HTML 속성 타입
import { cn } from '@/shared/lib/cn'        // 클래스네임 유틸리티

// 카드 컴포넌트 Props 인터페이스
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean  // 기본 패딩 제거 여부 (기본값: false)
}

/**
 * 카드 컴포넌트
 * 콘텐츠를 담는 재사용 가능한 카드 컨테이너입니다.
 * 
 * 기능:
 * - 기본 스타일: 둥근 모서리, 테두리, 그림자, 흰색 배경
 * - 기본 패딩: 16px (noPadding=true 시 제거)
 * - 모든 div 속성 지원 (className, onClick 등)
 * - 반응형 디자인 지원
 * 
 * 사용법:
 * <Card>
 *   <h3>카드 제목</h3>
 *   <p>카드 내용</p>
 * </Card>
 * 
 * <Card noPadding>
 *   <img src="image.jpg" alt="이미지" />
 * </Card>
 */
export function Card({ className, noPadding, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // 기본 카드 스타일
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        // 패딩 조건부 적용: noPadding이 false가 아닐 때만 패딩 추가
        !noPadding && 'p-4',
        // 추가 클래스네임 병합
        className
      )}
      {...props}  // 기타 div 속성들 전달
    >
      {children}  {/* 카드 내용 */}
    </div>
  )
}
