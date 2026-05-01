// 범용 버튼 컴포넌트: 다양한 스타일과 상태를 지원하는 재사용 가능한 버튼
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib/cn'  // 클래스네임 유틸리티 함수

// 버튼 스타일 변형 타입 정의
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'  // 기본, 외곽선, 고스트, 위험 스타일
type ButtonSize    = 'sm' | 'md' | 'lg'                       // 작음, 중간, 큼 사이즈

// 버튼 컴포넌트 Props 인터페이스
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant  // 버튼 스타일 변형
  size?: ButtonSize         // 버튼 크기
  isLoading?: boolean       // 로딩 상태 표시 여부
  fullWidth?: boolean       // 전체 너비 사용 여부
}

// 버튼 변형별 스타일 정의: 각 타입에 따른 Tailwind CSS 클래스
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-gray-300',        // 기본 파란색 버튼
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50 disabled:border-gray-300 disabled:text-gray-400', // 외곽선 버튼
  ghost:   'text-gray-700 hover:bg-gray-100 disabled:text-gray-400',                                                   // 고스트 버튼 (배경 없음)
  danger:  'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-gray-300',                    // 위험/삭제용 빨간색 버튼
}

// 버튼 크기별 스타일 정의: 각 사이즈에 따른 Tailwind CSS 클래스
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded',      // 작은 버튼
  md: 'h-10 px-4 text-sm rounded-lg',   // 중간 버튼 (기본)
  lg: 'h-12 px-6 text-base rounded-xl', // 큰 버튼
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* 로딩 스피너 */}
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
