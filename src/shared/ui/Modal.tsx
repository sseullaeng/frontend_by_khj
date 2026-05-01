// 모달 컴포넌트: 중앙에 나타나는 다이얼로그 패널
import { type ReactNode, useEffect } from 'react'  // React 타입 및 훅
import { createPortal } from 'react-dom'              // Portal 렌더링 기능
import { X } from 'lucide-react'                     // 닫기 아이콘
import { cn } from '@/shared/lib/cn'                 // 클래스네임 유틸리티

// 모달 컴포넌트 Props 인터페이스
interface ModalProps {
  isOpen: boolean      // 모달 열림 상태
  onClose: () => void  // 모달 닫기 함수
  title?: string       // 모달 제목 (선택사항)
  children: ReactNode  // 모달 내용
  className?: string   // 추가 CSS 클래스 (선택사항)
}

/**
 * 모달 컴포넌트
 * 화면 중앙에 나타나는 다이얼로그 패널입니다.
 * 
 * 기능:
 * - Portal을 사용하여 DOM 트리 외부에 렌더링 (z-index 문제 방지)
 * - ESC 키로 닫기
 * - 배경 클릭 시 닫기
 * - 열릴 때 배경 스크롤 방지
 * - 접근성 속성 지원 (role, aria-modal)
 * 
 * 사용법:
 * <Modal isOpen={isOpen} onClose={handleClose} title="제목">
 *   <p>모달 내용</p>
 * </Modal>
 */
export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  // ESC 키 이벤트 핸들러: ESC 키를 누르면 모달 닫기
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // 배경 스크롤 제어: 모달이 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null

  // Portal을 사용하여 document.body에 모달 렌더링
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"      // 접근성: 다이얼로그 역할
      aria-modal          // 접근성: 모달임을 명시
    >
      {/* 오버레이 배경 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl',
          className  
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="닫기"  
          >
            <X size={20} />
          </button>
        </div>
        
        {children}
      </div>
    </div>,
    document.body  // Portal 타겟: body 요소
  )
}
