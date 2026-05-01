// 범용 입력 필드 컴포넌트: 라벨, 에러 메시지, 도움말 텍스트를 포함한 재사용 가능한 입력 컴포넌트
import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib/cn'  // 클래스네임 유틸리티 함수

// 입력 필드 컴포넌트 Props 인터페이스
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string      // 입력 필드 라벨
  error?: string      // 에러 메시지 (있을 경우 빨간색으로 표시)
  helperText?: string // 도움말 텍스트 (에러가 없을 때 회색으로 표시)
}

// 입력 필드 컴포넌트: forwardRef를 사용하여 ref 전달 지원
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    // input ID 생성: 명시적 ID가 없으면 라벨에서 자동 생성
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="flex flex-col gap-1">
        {/* 라벨: 라벨이 있을 경우에만 렌더링 */}
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        {/* 입력 필드 */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // 기본 스타일
            'h-10 w-full rounded-lg border px-3 text-sm outline-none transition',
            'border-gray-300 bg-white placeholder:text-gray-400',
            // 포커스 상태 스타일
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            // 에러 상태 스타일
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            // 비활성화 상태 스타일
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            // 추가 클래스네임
            className
          )}
          {...props}
        />
        
        {/* 에러 메시지: 에러가 있을 때만 빨간색으로 표시 */}
        {error && <p className="text-xs text-red-500">{error}</p>}
        
        {/* 도움말 텍스트: 에러가 없을 때만 회색으로 표시 */}
        {!error && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

// 컴포넌트 displayName 설정 (디버깅용)
Input.displayName = 'Input'
