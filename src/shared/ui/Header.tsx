import { Link } from 'react-router-dom'
import { MessageCircle, User, Search, Package, Truck, Megaphone } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import NotificationDropdown from '@/features/notification/components/NotificationDropdown'
import { useState } from 'react'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const [showNotif, setShowNotif] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            쓸랭
          </Link>
          
          {/* 중앙 네비게이션 메뉴 */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/items"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Search size={18} />
              <span className="text-sm font-medium">물품찾기</span>
            </Link>
            <Link
              to="/items/new"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Package size={18} />
              <span className="text-sm font-medium">물품등록</span>
            </Link>
            <Link
              to="/delivery"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Truck size={18} />
              <span className="text-sm font-medium">거래대행</span>
            </Link>
            <Link
              to="/notices"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Megaphone size={18} />
              <span className="text-sm font-medium">새소식/이벤트</span>
            </Link>
          </nav>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-4">
            {/* 채팅과 알림 합치기 */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotif((v) => !v)}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <div className="relative">
                    <MessageCircle size={20} />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <span className="text-sm">채팅/알림</span>
                </button>
                {showNotif && (
                  <NotificationDropdown onClose={() => setShowNotif(false)} />
                )}
              </div>
            )}

            <Link
              to="/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <User size={20} />
              <span className="text-sm">{user ? user.nickname : '마이페이지'}</span>
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
