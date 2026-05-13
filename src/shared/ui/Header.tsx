// 헤더 컴포넌트: 상단 네비게이션 바 — 데스크톱(md+) 풀, 모바일(< md) 햄버거 드로어 + 알림 단축
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Bell, User, Search, Package, Truck, Megaphone, LogOut,
  Headphones, ShieldCheck, Menu, X, LogIn,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useLogout } from '@/features/auth/hooks'
import { useAdminMe } from '@/features/admin/hooks'
import { useDrawerStore } from '@/shared/store/drawerStore'
import { cn } from '@/shared/lib/cn'

type NavItem = { to: string; icon: React.ReactNode; label: string }
const NAV_ITEMS: NavItem[] = [
  { to: '/items',     icon: <Search size={18} />,     label: '물품찾기' },
  { to: '/items/new', icon: <Package size={18} />,    label: '물품등록' },
  { to: '/escrow',    icon: <Truck size={18} />,      label: '거래대행' },
  { to: '/notices',   icon: <Megaphone size={18} />,  label: '새소식/이벤트' },
  { to: '/support',   icon: <Headphones size={18} />, label: '고객센터' },
]

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending: isLogoutPending } = useLogout()
  const { toggleOpen, activeTab } = useDrawerStore()
  const { data: admin } = useAdminMe({ enabled: !user })

  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // 라우트 변경 시 자동 닫기
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // ESC 닫기
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" aria-label="쓸랭 홈" className="flex items-center shrink-0">
            <img src="/logo.png" alt="쓸랭" className="h-9 sm:h-10 w-auto select-none" draggable={false} />
          </Link>

          {/* 데스크톱 nav (md+) */}
          <nav className="hidden md:flex items-center gap-4 md:gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* 우측 영역 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 관리자 — 데스크톱 풀 */}
            {admin ? (
              <>
                {/* 채팅·알림 단축 — admin 도 동일하게 노출 (NotificationPanel 안 broadcast 폼 진입) */}
                <button
                  onClick={() => toggleOpen()}
                  aria-label="채팅·알림"
                  className={cn(
                    'relative flex items-center gap-2 px-2 py-2 rounded-lg transition-colors',
                    activeTab
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100',
                  )}
                >
                  <span className="relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  </span>
                  <span className="text-sm font-medium hidden md:block">채팅/알림</span>
                </button>
                <Link
                  to="/admin/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <ShieldCheck size={16} />
                  <span>관리자</span>
                  <span className="hidden md:block text-xs font-normal opacity-70">{admin.name}</span>
                </Link>
                {/* 모바일 — 아이콘만 */}
                <Link
                  to="/admin/dashboard"
                  className="sm:hidden p-2 rounded-lg bg-indigo-50 text-indigo-700"
                  aria-label="관리자"
                >
                  <ShieldCheck size={18} />
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
                {/* 채팅/알림 — 모바일에서도 단축 표시 */}
                {user && (
                  <button
                    onClick={() => toggleOpen()}
                    aria-label="채팅·알림"
                    className={cn(
                      'relative flex items-center gap-2 px-2 py-2 rounded-lg transition-colors',
                      activeTab
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100',
                    )}
                  >
                    <span className="relative">
                      <Bell size={20} />
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                    </span>
                    <span className="text-sm font-medium hidden md:block">채팅/알림</span>
                  </button>
                )}

                {/* 마이페이지 / 로그인 — 데스크톱(md+) 노출, 모바일은 햄버거 안 */}
                {/* 어드민(role=ADMIN) 은 마이페이지 거치지 않고 바로 대시보드로 */}
                <Link
                  to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/mypage'}
                  className="hidden md:flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <User size={20} />
                  <span className="text-sm hidden sm:block">
                    {user ? (user.role === 'ADMIN' ? '관리자 콘솔' : user.nickname) : '마이페이지'}
                  </span>
                </Link>

                {!user && (
                  <Link
                    to="/login"
                    className="hidden md:inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
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
                    className="hidden md:flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors text-sm disabled:opacity-50"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:block">로그아웃</span>
                  </button>
                )}
              </>
            )}

            {/* 햄버거 — 모바일 전용 (admin 모드일 땐 nav 자체가 admin 페이지 위주라 숨김) */}
            {!admin && (
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={mobileOpen}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 드롭다운 */}
      {!admin && mobileOpen && (
        <>
          {/* 백드롭 */}
          <div
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 top-16 bg-black/30 z-20"
          />
          {/* 패널 */}
          <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-gray-200 shadow-lg z-30">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 py-3 px-2 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}

              <div className="my-2 border-t border-gray-100" />

              {user ? (
                <>
                  <Link
                    to={user.role === 'ADMIN' ? '/admin/dashboard' : '/mypage'}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <User size={18} className="text-gray-500" />
                    <span className="text-sm font-medium">
                      {user.role === 'ADMIN' ? '관리자 콘솔' : user.nickname}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); logout() }}
                    disabled={isLogoutPending}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <LogOut size={18} className="text-gray-500" />
                    <span className="text-sm font-medium">로그아웃</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 py-3 mx-1 mb-1 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
                >
                  <LogIn size={16} />
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
