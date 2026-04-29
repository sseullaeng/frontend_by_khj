import { NavLink } from 'react-router-dom'
import { Home, Search, PlusCircle, Package, User } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const NAV_ITEMS = [
  { to: '/',        icon: Home,       label: '홈' },
  { to: '/items',   icon: Search,     label: '검색' },
  { to: '/items/new', icon: PlusCircle, label: '등록' },
  { to: '/chats',   icon: Package,    label: '거래' },
  { to: '/mypage',  icon: User,       label: '마이' },
]

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <ul className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs',
                  isActive ? 'text-primary-500' : 'text-gray-400'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
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
