// 마이페이지 컴포넌트: 사용자 프로필 정보 및 개인 메뉴 표시
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 관리 스토어
import { useLogout } from '@/features/auth/hooks'  // 로그아웃 훅
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트
import { ChevronRight } from 'lucide-react'  // Lucide 아이콘

// 마이페이지 메뉴 항목: 개인 기능 메뉴 목록
const MENU_ITEMS = [
  { label: '내 거래', to: '/mypage/items' },      // 내가 등록한 물품 목록
  { label: '찜 목록', to: '/mypage/wishes' },     // 찜한 물품 목록
  { label: '리뷰 관리', to: '/reviews' },        // 작성한 리뷰 관리
  { label: '차단 목록', to: '/mypage/blocks' },   // 차단한 사용자 목록
]

/**
 * 마이페이지 컴포넌트
 * 
 * 기능:
 * - 사용자 프로필 정보 표시 (닉네임, 이메일, 프로필 이미지)
 * - 개인 기능 메뉴 접근
 * - 로그아웃 기능
 * - 프로필 수정 페이지로 이동
 * - 포인트 정보 표시
 * 
 * UI 구조:
 * - 상단: 사용자 프로필 정보
 * - 중단: 개인 기능 메뉴 목록
 * - 하단: 로그아웃 버튼
 */
export default function MyPage() {
  const user = useAuthStore((s) => s.user)           // 현재 로그인된 사용자 정보
  const { mutate: logout, isPending } = useLogout()  // 로그아웃 뮤테이션

  return (
    <div className="flex flex-col gap-4">
      {/* 사용자 프로필 */}
      <div className="flex items-center gap-4 py-2">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
          {user?.profileImageUrl && (
            <img src={user.profileImageUrl} alt={user.nickname} className="w-full h-full object-cover" />
          )}
        </div>
        
        {/* 닉네임 및 이메일 */}
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

      {/* 마이페이지 메뉴 */}
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

      {/* 로그아웃 버튼 */}
      <Button variant="ghost" fullWidth isLoading={isPending} onClick={() => logout()}>
        로그아웃
      </Button>
    </div>
  )
}
