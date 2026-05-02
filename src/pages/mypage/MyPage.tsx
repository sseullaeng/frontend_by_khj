// 마이페이지: 일반 유저는 프로필·메뉴, 관리자는 사용자 통계 대시보드 표시
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 스토어
import { useLogout } from '@/features/auth/hooks'     // 로그아웃 훅
import { Button } from '@/shared/ui/Button'           // 버튼 컴포넌트
import { ChevronRight, ShieldCheck } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// 일반 유저 메뉴 목록
const MENU_ITEMS = [
  { label: '내 거래',   to: '/mypage/items' },
  { label: '찜 목록',   to: '/mypage/wishes' },
  { label: '리뷰 관리', to: '/reviews' },
  { label: '차단 목록', to: '/mypage/blocks' },
]

// ── 관리자 통계 더미 데이터 (백엔드 연동 전 그래프 폼용) ──────────────────

// 일별 신규 가입자 (최근 7일)
const DAILY_SIGNUP = [
  { day: '4/26', count: 12 },
  { day: '4/27', count: 18 },
  { day: '4/28', count: 9 },
  { day: '4/29', count: 24 },
  { day: '4/30', count: 31 },
  { day: '5/1',  count: 22 },
  { day: '5/2',  count: 15 },
]

// 거래 유형별 건수
const TRADE_TYPE_DATA = [
  { type: '중고거래', count: 142 },
  { type: '대여',     count: 87 },
  { type: '나눔',     count: 53 },
  { type: '거래대행', count: 34 },
]

// 거래 상태별 비율 (파이차트)
const TRADE_STATUS_DATA = [
  { name: '거래중',   value: 38 },
  { name: '완료',     value: 203 },
  { name: '취소',     value: 14 },
]
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b']

// 요약 카드 수치
const SUMMARY_STATS = [
  { label: '전체 회원',    value: '1,284명',   sub: '이번 달 +89' },
  { label: '오늘 신규',    value: '15명',      sub: '어제 대비 +3' },
  { label: '이번 달 거래', value: '316건',     sub: '저번 달 대비 +12%' },
  { label: '신고 대기',    value: '7건',       sub: '미처리 신고' },
]

// ── 관리자 통계 컴포넌트 ─────────────────────────────────────────────────
function AdminStats({ nickname }: { nickname: string }) {
  return (
    <div className="flex flex-col gap-6">

      {/* 관리자 헤더 */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <ShieldCheck size={22} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{nickname}</p>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">관리자</span>
        </div>
      </div>

      {/* 요약 카드 2×2 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {SUMMARY_STATS.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 일별 신규 가입자 — AreaChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">일별 신규 가입자 (최근 7일)</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={DAILY_SIGNUP} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#signupGrad)" strokeWidth={2} dot={{ r: 3 }} name="가입자" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 유형별 건수 — BarChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">거래 유형별 건수</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={TRADE_TYPE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="type" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="건수" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 상태 비율 — PieChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">거래 상태 비율</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={TRADE_STATUS_DATA}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {TRADE_STATUS_DATA.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

// ── 메인 MyPage 컴포넌트 ─────────────────────────────────────────────────
export default function MyPage() {
  const user               = useAuthStore((s) => s.user)    // 현재 로그인 유저
  const { mutate: logout, isPending } = useLogout()          // 로그아웃

  const isAdmin = user?.role === 'ADMIN'  // 관리자 여부

  return (
    <div className="flex flex-col gap-4">

      {/* 관리자: 통계 대시보드 / 일반 유저: 프로필 + 메뉴 */}
      {isAdmin ? (
        <AdminStats nickname={user?.nickname ?? '관리자'} />
      ) : (
        <>
          {/* 일반 유저 프로필 */}
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

          {/* 신뢰 지수 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600">신뢰 지수</span>
            <span className="font-bold text-primary-500">{user?.trustScore ?? 0}점</span>
          </div>

          {/* 메뉴 목록 */}
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

      {/* 로그아웃 버튼 (공통) */}
      <Button variant="ghost" fullWidth isLoading={isPending} onClick={() => logout()}>
        로그아웃
      </Button>

    </div>
  )
}
