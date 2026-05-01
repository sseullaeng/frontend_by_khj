import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { useLogout } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/Button'
import { ChevronRight } from 'lucide-react'

const MENU_ITEMS = [
  { label: '내 거래', to: '/mypage/items' },
  { label: '찜 목록', to: '/mypage/wishes' },
  { label: '리뷰 관리', to: '/reviews' },
  { label: '차단 목록', to: '/mypage/blocks' },
]

export default function MyPage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  return (
    <div className="flex flex-col gap-4">
      {/* 프로필 */}
      <div className="flex items-center gap-4 py-2">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
          {user?.profileImageUrl && (
            <img src={user.profileImageUrl} alt={user.nickname} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{user?.nickname}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <Link to="/mypage/edit" className="text-sm text-primary-500">수정</Link>
      </div>

      {/* 신뢰도 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-600">신뢰 지수</span>
        <span className="font-bold text-primary-500">{user?.trustScore ?? 0}점</span>
      </div>

      {/* 메뉴 */}
      <ul className="divide-y divide-gray-100">
        {MENU_ITEMS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="flex items-center justify-between py-4 text-sm text-gray-700">
              {item.label}
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </li>
        ))}
      </ul>

      <Button variant="ghost" fullWidth isLoading={isPending} onClick={() => logout()}>
        로그아웃
      </Button>
    </div>
  )
}
