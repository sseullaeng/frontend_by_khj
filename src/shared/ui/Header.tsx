// 헤더 컴포넌트: 애플리케이션 상단 네비게이션 바 - 로고, 메뉴, 사용자 메뉴 포함
import { Link } from 'react-router-dom'  // React Router의 링크 컴포넌트
import { Bell, User, Search, Package, Truck, Megaphone, LogOut, Headphones, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'  // 일반 사용자 인증
import { useLogout } from '@/features/auth/hooks'    // 로그아웃 훅
import { useAdminMe } from '@/features/admin/hooks'   // 관리자 인증 (admin AT 전용)
import { useDrawerStore } from '@/shared/store/drawerStore'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending: isLogoutPending } = useLogout()
  const { toggleOpen, activeTab } = useDrawerStore()

  // 일반 user 정보가 없을 때만 admin 가능성을 검사 — /admin/me 를 매 페이지 호출하지 않게 enabled 분기
  const { data: admin } = useAdminMe({ enabled: !user })

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
            <Link to="/support" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Headphones size={18} />
              <span className="text-sm font-medium hidden md:block">고객센터</span>
            </Link>
          </nav>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-3">
            {/* 관리자 분기 — 일반 사용자 메뉴 대신 관리 진입 + 로그아웃만 표시 */}
            {admin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <ShieldCheck size={16} />
                  <span className="hidden sm:block">관리자</span>
                  <span className="hidden md:block text-xs font-normal opacity-70">{admin.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  disabled={isLogoutPending}
                  title="로그아웃"
                  className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors text-sm disabled:opacity-50"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:block">로그아웃</span>
                </button>
              </>
            ) : (
              <>
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
                {user && (
                  <button
                    type="button"
                    onClick={() => logout()}
                    disabled={isLogoutPending}
                    title="로그아웃"
                    className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors text-sm disabled:opacity-50"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:block">로그아웃</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
