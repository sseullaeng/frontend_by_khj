// 마이페이지: 일반 유저는 프로필·포인트·메뉴, 관리자는 통계 대시보드(lazy 로드)
import { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Wallet, MailCheck, MailWarning, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store'
import { useLogout, useResendVerification } from '@/features/auth/hooks'
import { loginWithGoogle } from '@/features/auth/oauth'  // 카카오는 미운영, 일단 제외
import { usePointBalance } from '@/features/payment/hooks'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

// 관리자 차트 대시보드 (recharts ~300KB) — 관리자 진입 시에만 로드
const AdminStats = lazy(() => import('./AdminStats'))

const MENU_ITEMS = [
  { label: '내 거래',     to: '/mypage/items' },
  { label: '포인트 내역', to: '/point' },
  { label: '찜 목록',     to: '/mypage/wishes' },
  { label: '리뷰 관리',   to: '/reviews' },
  { label: '차단 목록',   to: '/mypage/blocks' },
  { label: '연체 정보',   to: '/mypage/overdue' },
]

export default function MyPage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className={cn('flex flex-col gap-4', !isAdmin && 'max-w-md mx-auto w-full')}>

      {isAdmin ? (
        <Suspense fallback={<p className="py-12 text-center text-sm text-gray-400">대시보드 불러오는 중...</p>}>
          <AdminStats nickname={user?.nickname ?? '관리자'} />
        </Suspense>
      ) : (
        <>
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

          {/* 이메일 인증 상태 */}
          <EmailVerificationCard />

          {/* 신뢰 지수 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600">신뢰 지수</span>
            <span className="font-bold text-primary-500">{user?.trustScore ?? 0}점</span>
          </div>

          {/* 포인트 카드 — 3분할 + 충전/출금 */}
          <PointCard />

          {/* SNS 연결 — LOCAL 가입자 한정 (라운드14) */}
          <SocialLinkCard />

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
        </>
      )}

      <Button variant="ghost" fullWidth isLoading={isPending} onClick={() => logout()}>
        로그아웃
      </Button>
    </div>
  )
}

function EmailVerificationCard() {
  const user = useAuthStore((s) => s.user)
  const { mutate: resend, isPending } = useResendVerification()
  if (!user) return null

  return user.emailVerified ? (
    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl">
      <MailCheck size={18} className="text-emerald-600 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="text-emerald-700 font-medium">이메일 인증 완료</p>
        <p className="text-xs text-emerald-600/80 truncate">{user.email}</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <MailWarning size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm min-w-0">
          <p className="text-amber-700 font-semibold">이메일 인증이 필요해요</p>
          <p className="text-xs text-amber-600/90 mt-0.5">
            가입 시 받은 메일의 인증 링크를 클릭해 주세요. 메일을 못 받으셨다면 재전송 가능합니다.
          </p>
        </div>
      </div>
      <button
        onClick={() => resend()}
        disabled={isPending}
        className="shrink-0 self-stretch sm:self-start px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50"
      >
        {isPending ? '전송 중' : '재전송'}
      </button>
    </div>
  )
}

function SocialLinkCard() {
  const user = useAuthStore((s) => s.user)
  const [pending, setPending] = useState<'google' | null>(null)

  // 이미 소셜 계정과 연결된 경우 (provider !== LOCAL) 는 연결 작업 불필요
  if (!user || user.socialProvider !== 'LOCAL') return null

  const start = async () => {
    setPending('google')
    try {
      await loginWithGoogle('link')
      // redirect — 이후 코드 실행 X
    } catch (err) {
      setPending(null)
      const msg = err instanceof Error ? err.message : '연결을 시작하지 못했어요.'
      toast.error(msg)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 size={16} className="text-primary-500" />
        <p className="text-sm font-semibold text-gray-900">SNS 계정 연결</p>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        연결하면 구글 로그인으로도 이 계정에 들어올 수 있어요. 기존 비밀번호 로그인은 그대로 유지됩니다.
      </p>
      <button
        type="button"
        onClick={start}
        disabled={pending !== null}
        className="w-full py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold disabled:opacity-50"
      >
        {pending === 'google' ? '연결 중...' : '구글 연결'}
      </button>
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

      <p className="text-2xl font-bold mb-3 truncate">
        {totalBalance.toLocaleString()}
        <span className="text-sm font-medium opacity-80 ml-1">P</span>
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/15 rounded-lg py-2 px-3 min-w-0">
          <p className="text-[11px] opacity-80 mb-0.5">사용 가능</p>
          <p className="text-sm font-semibold truncate">{balance.toLocaleString()}P</p>
        </div>
        <div className="bg-white/15 rounded-lg py-2 px-3 min-w-0">
          <p className="text-[11px] opacity-80 mb-0.5">거래 보관 중</p>
          <p className="text-sm font-semibold truncate">{holdAmount.toLocaleString()}P</p>
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
