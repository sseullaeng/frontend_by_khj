// 하단 네비게이션 컴포넌트: 모바일 환경에서 주요 메뉴를 제공하는 바 형태 네비게이션
import { NavLink } from 'react-router-dom'  // React Router의 NavLink 컴포넌트
import { Home, Search, PlusCircle, Package, User } from 'lucide-react'  // Lucide 아이콘들
import { cn } from '@/shared/lib/cn'        // 클래스네임 유틸리티

// 하단 네비게이션 메뉴 아이템 정의
const NAV_ITEMS = [
  { to: '/',        icon: Home,       label: '홈' },       // 메인 홈페이지
  { to: '/items',   icon: Search,     label: '검색' },    // 물품 검색 페이지
  { to: '/items/new', icon: PlusCircle, label: '등록' },  // 물품 등록 페이지
  { to: '/chats',   icon: Package,    label: '거래' },    // 거래/채팅 페이지
  { to: '/mypage',  icon: User,       label: '마이' },    // 마이페이지
]

/**
 * 하단 네비게이션 컴포넌트
 * 모바일 환경에서 화면 하단에 고정되는 바 형태의 네비게이션입니다.
 * 
 * 기능:
 * - 화면 하단에 sticky 포지셔닝으로 고정
 * - 현재 활성화된 페이지에 따라 아이콘과 텍스트 색상 변경
 * - 활성화된 아이콘은 더 두꺼운 선(strokeWidth)으로 표시
 * - 아이폰 노치 영역 대응 (safe-area-pb)
 * - 반응형 디자인으로 모바일 환경에 최적화
 * 
 * 상호작용:
 * - 활성화된 메뉴: 파란색 아이콘과 텍스트, 두꺼운 아이콘 선
 * - 비활성화된 메뉴: 회색 아이콘과 텍스트, 얇은 아이콘 선
 */
export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      {/* 메뉴 아이템들을 수평으로 배치 */}
      <ul className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}                    // 이동할 경로
              end={to === '/'}           // 홈페이지는 정확히 일치할 때만 활성화
              className={({ isActive }) =>  // 활성화 상태에 따른 스타일링
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs',  // 기본 레이아웃
                  isActive ? 'text-primary-500' : 'text-gray-400'      // 활성화 상태 색상
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* 아이콘: 활성화 상태에 따라 선 두께 조절 */}
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 1.5}  // 활성화 시 더 두꺼운 선
                  />
                  {/* 라벨 텍스트 */}
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
