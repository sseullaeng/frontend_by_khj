// 마이페이지: 일반 유저는 프로필·포인트·메뉴.
// 관리자는 진입 즉시 관리 대시보드로 redirect (마이페이지 메뉴 자체가 관리자에게 의미 없음).
import { Link, Navigate } from 'react-router-dom'
import { ChevronRight, Wallet } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useLogout } from '@/features/auth/hooks'
import { usePointBalance } from '@/features/payment/hooks'
import { Button } from '@/shared/ui/Button'

const MENU_ITEMS = [
  { label: '내 거래',     to: '/mypage/items' },
  { label: '포인트 내역', to: '/point' },
  { label: '찜 목록',     to: '/mypage/wishes' },
  { label: '리뷰 관리',   to: '/reviews' },
  { label: '차단 목록',   to: '/mypage/blocks' },
]

export default function MyPage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  // 관리자는 마이페이지 대신 관리 대시보드로 — history 안 쌓이게 replace
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 일반 유저 프로필 */}
      <div className="flex items-center gap-4 py-2">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
          {user?.profileImage && (
            <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{user?.nickname}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <Link to="/mypage/edit" className="text-sm text-primary-500">수정</Link>
      </div>

      {/* 신뢰 지수 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-600">신뢰 지수</span>
        <span className="font-bold text-primary-500">{user?.trustScore ?? 0}점</span>
      </div>

      {/* 포인트 카드 — 3분할 + 충전/출금 */}
      <PointCard />

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

function PointCard() {
  const { data } = usePointBalance()
  const balance      = data?.balance ?? 0
  const holdAmount   = data?.holdAmount ?? 0
  const totalBalance = data?.totalBalance ?? balance + holdAmount

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="opacity-90" />
          <span className="text-sm opacity-90">내 포인트</span>
        </div>
        <Link to="/point" className="text-xs opacity-80 hover:opacity-100 underline">
          내역 보기
        </Link>
      </div>

      <p className="text-2xl font-bold mb-3">
        {totalBalance.toLocaleString()}
        <span className="text-sm font-medium opacity-80 ml-1">P</span>
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/15 rounded-lg py-2 px-3">
          <p className="text-[11px] opacity-80 mb-0.5">사용 가능</p>
          <p className="text-sm font-semibold">{balance.toLocaleString()}P</p>
        </div>
        <div className="bg-white/15 rounded-lg py-2 px-3">
          <p className="text-[11px] opacity-80 mb-0.5">거래 보관 중</p>
          <p className="text-sm font-semibold">{holdAmount.toLocaleString()}P</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to="/point/charge"
          className="flex-1 py-2 text-center bg-white text-primary-600 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          충전
        </Link>
        <Link
          to="/point/withdraw"
          className="flex-1 py-2 text-center bg-white/15 rounded-lg text-sm font-medium hover:bg-white/25 transition-colors"
        >
          출금
        </Link>
      </div>
    </div>
  )
}
