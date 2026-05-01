// 헤더 컴포넌트: 애플리케이션 상단 네비게이션 바 - 로고, 메뉴, 사용자 메뉴 포함
import { Link } from 'react-router-dom'  // React Router의 링크 컴포넌트
import { Bell, User, Search, Package, Truck, Megaphone } from 'lucide-react'  // Lucide 아이콘 라이브러리
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 관리 스토어
import { useDrawerStore } from '@/shared/store/drawerStore'  // 드로워 상태 관리 스토어

// 헤더 컴포넌트: 로그인 상태에 따라 다른 UI를 표시
export default function Header() {
  const user = useAuthStore((s) => s.user)           // 현재 로그인된 사용자 정보
  const { toggleOpen, activeTab } = useDrawerStore()    // 드로워 토글 함수 및 활성 탭

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고: 홈페이지로 이동하는 링크 */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            쓸랭
          </Link>

          {/* 중앙 네비게이션 메뉴: 주요 기능으로 이동하는 링크들 */}
          <nav className="flex items-center gap-4 md:gap-8">
            <Link to="/items" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Search size={18} />
              <span className="text-sm font-medium hidden md:block">물품찾기</span>
            </Link>
            <Link to="/items/new" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Package size={18} />
              <span className="text-sm font-medium hidden md:block">물품등록</span>
            </Link>
            <Link to="/escrow" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Truck size={18} />
              <span className="text-sm font-medium hidden md:block">거래대행</span>
            </Link>
            <Link to="/notices" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Megaphone size={18} />
              <span className="text-sm font-medium hidden md:block">새소식/이벤트</span>
            </Link>
          </nav>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => toggleOpen()}
                className={`relative flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                  activeTab
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                }`}
              >
                <span className="relative">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                </span>
                <span className="text-sm font-medium hidden md:block">채팅/알림</span>
              </button>
            )}

            <Link
              to="/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <User size={20} />
              <span className="text-sm hidden sm:block">{user ? user.nickname : '마이페이지'}</span>
            </Link>

            {!user && (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
