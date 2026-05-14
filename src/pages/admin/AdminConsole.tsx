// 관리자 콘솔 — 사이드바 + 우측 콘텐츠 단일 페이지
//
// 라운드13 — 메뉴를 카테고리화하고 사이드바에서 클릭 시 우측 콘텐츠만 교체.
//   URL 은 /admin/dashboard 고정 (직접 /admin/users 등 URL 진입은 기존 라우트 유지).
//   대시보드(통계 차트) 는 카테고리 첫 항목.
//
// content 는 기존 admin page 컴포넌트를 inline 렌더 (D1) → 작업 빠르고 재사용.
//   각 컴포넌트가 자체 컨테이너/헤더를 가져 inline 시 중첩될 수 있음 — 후속 디자인 정리.
import { lazy, Suspense, useState, type ComponentType } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserPlus,
  UserX,
  ShoppingBag,
  Package,
  AlertTriangle,
  MessageSquare,
  ArrowDownToLine,
  Megaphone,
  Image as ImageIcon,
  ShieldAlert,
  Truck,
  Menu as MenuIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// ── 메뉴별 lazy 로드 (관리자 페이지가 무거우니 첫 진입 시점에만) ──────────────
const AdminStats = lazy(() => import('@/pages/mypage/AdminStats'))
const AdminUserPage = lazy(() => import('@/pages/admin/AdminUserPage'))
const AdminTodayUsersPage = lazy(() => import('@/pages/admin/AdminTodayUsersPage'))
const AdminWithdrawnUsersPage = lazy(() => import('@/pages/admin/AdminWithdrawnUsersPage'))
const AdminMonthlyTradesPage = lazy(() => import('@/pages/admin/AdminMonthlyTradesPage'))
const AdminItemPage = lazy(() => import('@/pages/admin/AdminItemPage'))
const AdminEscrowApplicationsPage = lazy(() => import('@/pages/admin/AdminEscrowApplicationsPage'))
const AdminReportPage = lazy(() => import('@/pages/admin/AdminReportPage'))
const SupportPage = lazy(() => import('@/pages/support/SupportPage')) // admin 일 때 문의 목록 노출
const AdminWithdrawPage = lazy(() => import('@/pages/admin/AdminWithdrawPage'))
const AdminNoticePage = lazy(() => import('@/pages/admin/AdminNoticePage'))
const AdminBannerPage = lazy(() => import('@/pages/admin/AdminBannerPage'))
const AdminEscrowConfigPage = lazy(() => import('@/pages/admin/AdminEscrowConfigPage'))
const AdminDeliveryPage = lazy(() => import('@/pages/admin/AdminDeliveryPage'))

interface MenuItem {
  id: string
  label: string
  icon: typeof Users
  component: ComponentType
}
interface MenuGroup {
  id: string
  label: string
  items: MenuItem[]
}

const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    items: [{ id: 'stats', label: '통계', icon: LayoutDashboard, component: AdminStats }],
  },
  {
    id: 'users',
    label: '회원',
    items: [
      { id: 'users.all', label: '전체 회원', icon: Users, component: AdminUserPage },
      { id: 'users.today', label: '오늘 신규', icon: UserPlus, component: AdminTodayUsersPage },
      {
        id: 'users.withdrawn',
        label: '탈퇴 회원',
        icon: UserX,
        component: AdminWithdrawnUsersPage,
      },
    ],
  },
  {
    id: 'trades',
    label: '거래·물품',
    items: [
      {
        id: 'trades.monthly',
        label: '이번달 거래',
        icon: ShoppingBag,
        component: AdminMonthlyTradesPage,
      },
      { id: 'trades.items', label: '물품 관리', icon: Package, component: AdminItemPage },
      {
        id: 'trades.escrow',
        label: '거래대행',
        icon: ShieldAlert,
        component: AdminEscrowApplicationsPage,
      },
    ],
  },
  {
    id: 'ops',
    label: '운영',
    items: [
      { id: 'ops.reports', label: '신고 처리', icon: AlertTriangle, component: AdminReportPage },
      { id: 'ops.support', label: '문의 처리', icon: MessageSquare, component: SupportPage },
      {
        id: 'ops.withdraws',
        label: '출금 관리',
        icon: ArrowDownToLine,
        component: AdminWithdrawPage,
      },
    ],
  },
  {
    id: 'content',
    label: '콘텐츠',
    items: [
      { id: 'content.notices', label: '알림', icon: Megaphone, component: AdminNoticePage },
      { id: 'content.banners', label: '배너', icon: ImageIcon, component: AdminBannerPage },
    ],
  },
  {
    id: 'settings',
    label: '설정',
    items: [
      {
        id: 'settings.escrow',
        label: '에스크로 설정',
        icon: ShieldAlert,
        component: AdminEscrowConfigPage,
      },
      { id: 'settings.delivery', label: '배달 관리', icon: Truck, component: AdminDeliveryPage },
    ],
  },
]

const ALL_ITEMS = MENU_GROUPS.flatMap((g) => g.items)
const DEFAULT_MENU = 'stats'

export default function AdminConsole() {
  const [activeId, setActiveId] = useState<string>(DEFAULT_MENU)
  const [collapsed, setCollapsed] = useState(false)
  // 모바일 사이드바 토글
  const [mobileOpen, setMobileOpen] = useState(false)
  // 그룹 펼침 상태 — 기본 다 펼침
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(MENU_GROUPS.map((g) => g.id)))

  const activeItem = ALL_ITEMS.find((i) => i.id === activeId) ?? ALL_ITEMS[0]
  const ActiveComponent = activeItem.component

  const toggleGroup = (gid: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(gid)) next.delete(gid)
      else next.add(gid)
      return next
    })
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
    setMobileOpen(false)
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] gap-0 lg:gap-6 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      {/* 모바일 헤더 (햄버거) */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
          aria-label="메뉴"
        >
          <MenuIcon size={20} />
        </button>
        <h2 className="text-sm font-semibold text-gray-900 truncate">{activeItem.label}</h2>
      </div>

      {/* ── 사이드바 ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 shrink-0 transition-all',
          // 데스크탑
          'hidden lg:block',
          collapsed ? 'lg:w-16' : 'lg:w-60',
          // 모바일 — drawer
          mobileOpen && '!block fixed inset-y-0 left-0 w-64 z-40 shadow-xl !border-r'
        )}
      >
        <div className="sticky top-0 max-h-screen overflow-y-auto p-3 flex flex-col gap-1">
          {/* 접기 버튼 (데스크탑) */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:inline-flex self-end items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
            aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {MENU_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id)
            return (
              <div key={group.id} className="mb-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                  >
                    <span>{group.label}</span>
                    <span className={cn('transition-transform', !isOpen && '-rotate-90')}>
                      <ChevronLeft size={12} className="rotate-[-90deg]" />
                    </span>
                  </button>
                )}
                {(collapsed || isOpen) && (
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = item.id === activeId
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleSelect(item.id)}
                            className={cn(
                              'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors',
                              active
                                ? 'bg-primary-500 text-white'
                                : 'text-gray-700 hover:bg-gray-100',
                              collapsed && 'justify-center'
                            )}
                            title={collapsed ? item.label : undefined}
                          >
                            <Icon size={16} className="shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* 모바일 사이드바 backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
        />
      )}

      {/* ── 우측 콘텐츠 ───────────────────────────────────────── */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
        <Suspense
          fallback={<p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>}
        >
          <ActiveComponent />
        </Suspense>
      </main>
    </div>
  )
}
