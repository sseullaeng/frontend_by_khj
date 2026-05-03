// 마이페이지: 일반 유저는 프로필·메뉴, 관리자는 사용자/거래/신고 통계 대시보드 표시
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 스토어
import { useLogout } from '@/features/auth/hooks'     // 로그아웃 훅
import { Button } from '@/shared/ui/Button'           // 버튼 컴포넌트
import { ChevronRight, ShieldCheck } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── 타입 정의 ────────────────────────────────────────────────────────────────

/** 유저 상태: 정상 / 휴면 / 활동정지 / 탈퇴 */
type UserStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'WITHDRAWN'

/** 거래 유형: 중고거래 / 대여 / 나눔 / 거래대행 */
type TradeType = 'SELL' | 'RENT' | 'SHARE' | 'ESCROW'

/** 거래 상태: 진행중 / 완료 / 취소 */
type TradeStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

/** 관리자 유저 정보 */
interface AdminUser {
  id: number
  profileImageUrl: string | null
  nickname: string
  memberId: string       // 예: "user_001"
  signupPath: string     // "이메일" | "카카오" | "네이버"
  trustScore: number
  tradeCount: number
  joinedAt: string       // "YYYY-MM-DD"
  reportCount: number
  status: UserStatus
  suspendedAt?: string   // 활동정지 처리 날짜 (YYYY-MM-DD)
  suspendDays?: number   // 활동정지 기간 (일)
}

/** 관리자 거래 정보 */
interface AdminTrade {
  id: number
  itemImageUrl: string | null
  itemTitle: string
  itemType: TradeType
  tradeStatus: TradeStatus
  price: number
  buyerNickname: string
  sellerNickname: string
  date: string
}



// ── 목업 데이터 ──────────────────────────────────────────────────────────────

/** 관리자 유저 목업 데이터 (11명) */
const MOCK_USERS: AdminUser[] = [
  { id: 1,  profileImageUrl: null, nickname: '테스트유저', memberId: 'user_001', signupPath: '이메일', trustScore: 80, tradeCount: 12, joinedAt: '2026-05-02', reportCount: 0, status: 'ACTIVE' },
  { id: 2,  profileImageUrl: null, nickname: '홍길동',     memberId: 'user_002', signupPath: '카카오', trustScore: 72, tradeCount: 7,  joinedAt: '2026-05-02', reportCount: 1, status: 'ACTIVE' },
  { id: 3,  profileImageUrl: null, nickname: '김영희',     memberId: 'user_003', signupPath: '네이버', trustScore: 40, tradeCount: 3,  joinedAt: '2026-05-01', reportCount: 5, status: 'SUSPENDED', suspendedAt: '2026-05-01', suspendDays: 7 },
  { id: 4,  profileImageUrl: null, nickname: '이철수',     memberId: 'user_004', signupPath: '이메일', trustScore: 90, tradeCount: 25, joinedAt: '2026-04-30', reportCount: 0, status: 'ACTIVE' },
  { id: 5,  profileImageUrl: null, nickname: '박민준',     memberId: 'user_005', signupPath: '카카오', trustScore: 0,  tradeCount: 2,  joinedAt: '2026-04-29', reportCount: 3, status: 'WITHDRAWN' },
  { id: 6,  profileImageUrl: null, nickname: '최수진',     memberId: 'user_006', signupPath: '이메일', trustScore: 65, tradeCount: 9,  joinedAt: '2026-04-28', reportCount: 0, status: 'ACTIVE' },
  { id: 7,  profileImageUrl: null, nickname: '정우성',     memberId: 'user_007', signupPath: '네이버', trustScore: 55, tradeCount: 4,  joinedAt: '2026-04-28', reportCount: 2, status: 'ACTIVE' },
  { id: 8,  profileImageUrl: null, nickname: '강동원',     memberId: 'user_008', signupPath: '카카오', trustScore: 30, tradeCount: 1,  joinedAt: '2026-04-27', reportCount: 8, status: 'SUSPENDED', suspendedAt: '2026-04-30', suspendDays: 30 },
  { id: 9,  profileImageUrl: null, nickname: '손예진',     memberId: 'user_009', signupPath: '이메일', trustScore: 95, tradeCount: 31, joinedAt: '2026-04-27', reportCount: 0, status: 'ACTIVE' },
  { id: 10, profileImageUrl: null, nickname: '유재석',     memberId: 'user_010', signupPath: '카카오', trustScore: 88, tradeCount: 18, joinedAt: '2026-04-26', reportCount: 0, status: 'ACTIVE' },
  { id: 11, profileImageUrl: null, nickname: '신동엽',     memberId: 'user_011', signupPath: '이메일', trustScore: 0,  tradeCount: 0,  joinedAt: '2026-04-26', reportCount: 1, status: 'WITHDRAWN' },
  { id: 12, profileImageUrl: null, nickname: '이미래',     memberId: 'user_012', signupPath: '카카오', trustScore: 60, tradeCount: 5,  joinedAt: '2026-04-25', reportCount: 0, status: 'DORMANT' },
  { id: 13, profileImageUrl: null, nickname: '박지훈',     memberId: 'user_013', signupPath: '이메일', trustScore: 45, tradeCount: 2,  joinedAt: '2026-04-24', reportCount: 0, status: 'DORMANT' },
  { id: 14, profileImageUrl: null, nickname: '조은별',     memberId: 'user_014', signupPath: '네이버', trustScore: 70, tradeCount: 8,  joinedAt: '2026-04-23', reportCount: 0, status: 'DORMANT' },
]

/** 관리자 거래 목업 데이터 (12건) */
const MOCK_TRADES: AdminTrade[] = [
  { id: 1,  itemImageUrl: null, itemTitle: '아이폰 15 Pro',       itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 1100000, buyerNickname: '홍길동',   sellerNickname: '이철수',     date: '2026-05-02' },
  { id: 2,  itemImageUrl: null, itemTitle: '캠핑 텐트 대여',       itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 25000,   buyerNickname: '최수진',   sellerNickname: '테스트유저', date: '2026-05-01' },
  { id: 3,  itemImageUrl: null, itemTitle: '어린이 장난감',        itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '정우성',   sellerNickname: '손예진',     date: '2026-05-01' },
  { id: 4,  itemImageUrl: null, itemTitle: '맥북 에어 M2',         itemType: 'SELL',   tradeStatus: 'ACTIVE',    price: 1400000, buyerNickname: '강동원',   sellerNickname: '유재석',     date: '2026-04-30' },
  { id: 5,  itemImageUrl: null, itemTitle: '전동 킥보드',          itemType: 'RENT',   tradeStatus: 'CANCELLED', price: 15000,   buyerNickname: '박민준',   sellerNickname: '최수진',     date: '2026-04-30' },
  { id: 6,  itemImageUrl: null, itemTitle: '타 플랫폼 거래 대행',  itemType: 'ESCROW', tradeStatus: 'ACTIVE',    price: 350000,  buyerNickname: '테스트유저', sellerNickname: '홍길동',   date: '2026-04-29' },
  { id: 7,  itemImageUrl: null, itemTitle: '빈티지 자켓',          itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 45000,   buyerNickname: '김영희',   sellerNickname: '정우성',     date: '2026-04-29' },
  { id: 8,  itemImageUrl: null, itemTitle: 'DSLR 카메라 대여',     itemType: 'RENT',   tradeStatus: 'COMPLETED', price: 80000,   buyerNickname: '이철수',   sellerNickname: '강동원',     date: '2026-04-28' },
  { id: 9,  itemImageUrl: null, itemTitle: '아기 옷 나눔',         itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '손예진',   sellerNickname: '유재석',     date: '2026-04-28' },
  { id: 10, itemImageUrl: null, itemTitle: 'PS5 본체',             itemType: 'SELL',   tradeStatus: 'CANCELLED', price: 680000,  buyerNickname: '신동엽',   sellerNickname: '이철수',     date: '2026-04-27' },
  { id: 11, itemImageUrl: null, itemTitle: '자전거 대여',          itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 10000,   buyerNickname: '최수진',   sellerNickname: '테스트유저', date: '2026-04-27' },
  { id: 12, itemImageUrl: null, itemTitle: '전자레인지',           itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 55000,   buyerNickname: '정우성',   sellerNickname: '손예진',     date: '2026-04-26' },
]



/** 파이차트 색상 배열 */
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b']




// ── AdminStats 컴포넌트 ───────────────────────────────────────────────────────

/** 관리자 통계 대시보드 (차트, 요약 카드 — 클릭 시 관리자 페이지로 이동) */
function AdminStats({ nickname }: { nickname: string }) {
  const navigate = useNavigate()
  // 영역 차트 마우스 호버 날짜 상태
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // 차트 호버 카드 숨김 딜레이 타이머 ref (마우스를 잠깐 벗어나도 카드가 유지되도록)
  const hideTimerRef = useRef<number>(0)

  // 탈퇴 회원 수 (카드 표시용)
  const withdrawnCount = MOCK_USERS.filter(u => u.status === 'WITHDRAWN').length

  // ── 차트 공통 날짜 범위 필터 상태 (기본값: 목업 전체 기간) ──────────────
  const [startDate, setStartDate] = useState('2026-04-23')
  const [endDate,   setEndDate]   = useState('2026-05-02')

  // YYYY-MM-DD → 차트 X축 표시용 'M/D' 변환
  const toChartDay = (date: string) => {
    const [, m, d] = date.split('-')
    return `${parseInt(m)}/${parseInt(d)}`
  }

  // 날짜 범위 내 일별 가입자 차트 데이터 (일 단위 순회)
  const filteredSignupChartData = (() => {
    const result: { day: string; count: number; fullDate: string }[] = []
    const cur = new Date(startDate + 'T00:00:00')
    const fin = new Date(endDate   + 'T00:00:00')
    while (cur <= fin) {
      const y  = cur.getFullYear()
      const m  = String(cur.getMonth() + 1).padStart(2, '0')
      const d  = String(cur.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      result.push({
        day:      toChartDay(dateStr),
        fullDate: dateStr,
        count:    MOCK_USERS.filter(u => u.joinedAt === dateStr).length,
      })
      cur.setDate(cur.getDate() + 1)
    }
    return result
  })()

  // 차트 라벨(day) → 전체 날짜(fullDate) 역매핑 (호버 카드 유저 조회용)
  const chartDayToDate: Record<string, string> = Object.fromEntries(
    filteredSignupChartData.map(d => [d.day, d.fullDate])
  )

  // 날짜 범위 내 거래 데이터 (BarChart / PieChart 공통 필터링)
  const filteredTradesInRange = MOCK_TRADES.filter(
    t => t.date >= startDate && t.date <= endDate
  )

  // 거래 유형별 건수 (날짜 범위 적용)
  const filteredTradeTypeData = [
    { type: '중고거래', count: filteredTradesInRange.filter(t => t.itemType === 'SELL').length },
    { type: '대여',     count: filteredTradesInRange.filter(t => t.itemType === 'RENT').length },
    { type: '나눔',     count: filteredTradesInRange.filter(t => t.itemType === 'SHARE').length },
    { type: '거래대행', count: filteredTradesInRange.filter(t => t.itemType === 'ESCROW').length },
  ]

  // 거래 상태 비율 (날짜 범위 적용)
  const filteredTradeStatusData = [
    { name: '거래중', value: filteredTradesInRange.filter(t => t.tradeStatus === 'ACTIVE').length },
    { name: '완료',   value: filteredTradesInRange.filter(t => t.tradeStatus === 'COMPLETED').length },
    { name: '취소',   value: filteredTradesInRange.filter(t => t.tradeStatus === 'CANCELLED').length },
  ]

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

      {/* 요약 카드 2×2 그리드 (모두 클릭 가능) */}
      <div className="grid grid-cols-2 gap-3">
        {/* 전체 회원 카드 */}
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">전체 회원</p>
          <p className="text-xl font-bold text-gray-900">1,284명</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">이번 달 +89</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 오늘 신규 카드 */}
        <button
          onClick={() => navigate('/admin/users/today')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">오늘 신규</p>
          <p className="text-xl font-bold text-gray-900">15명</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">어제 대비 +3</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 이번달 거래 카드 */}
        <button
          onClick={() => navigate('/admin/trades')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">이번달 거래</p>
          <p className="text-xl font-bold text-gray-900">316건</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">저번달 대비 +12%</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 신고 대기 카드 */}
        <button
          onClick={() => navigate('/admin/reports')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">신고 대기</p>
          <p className="text-xl font-bold text-red-500">7건</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">미처리 신고</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        {/* 탈퇴 회원 카드 — 2열 전체 너비 */}
        <button
          onClick={() => navigate('/admin/users/withdrawn')}
          className="col-span-2 bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 mb-1">탈퇴 회원</p>
          <p className="text-xl font-bold text-gray-400">{withdrawnCount}명</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-400">복구 가능 · 클릭하여 목록 보기</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>
      </div>

      {/* ── 차트 공통 날짜 범위 필터 ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">차트 조회 기간</p>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 시작 날짜 달력 입력 */}
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={e => setStartDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400"
          />
          <span className="text-gray-400 text-sm shrink-0">~</span>
          {/* 종료 날짜 달력 입력 */}
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* 일별 신규 가입자 — AreaChart (날짜 범위 필터 적용) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          일별 신규 가입자
          <span className="text-xs font-normal text-gray-400 ml-2">
            {startDate} ~ {endDate}
          </span>
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={filteredSignupChartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            onMouseMove={(data: { activeLabel?: string }) => {
              // 마우스 이동 시 타이머 취소 후 날짜 업데이트
              window.clearTimeout(hideTimerRef.current)
              if (data.activeLabel) setHoveredDate(data.activeLabel)
            }}
            onMouseLeave={() => {
              // 마우스가 차트를 벗어나면 400ms 후 카드 숨김
              hideTimerRef.current = window.setTimeout(() => setHoveredDate(null), 400)
            }}
          >
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              fill="url(#signupGrad)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="가입자"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* 호버 시 해당 날짜 가입자 미니 카드 */}
        {hoveredDate !== null && (
          <div
            className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
            onMouseEnter={() => window.clearTimeout(hideTimerRef.current)}
            onMouseLeave={() => { hideTimerRef.current = window.setTimeout(() => setHoveredDate(null), 400) }}
          >
            <p className="text-xs font-semibold text-indigo-700 mb-2">{hoveredDate} 가입자</p>
            <ul className="space-y-1">
              {/* chartDayToDate로 표시용 라벨 → fullDate 변환 후 유저 조회 */}
              {MOCK_USERS.filter(u => u.joinedAt === (chartDayToDate[hoveredDate] ?? '')).map(user => (
                <li key={user.id} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-indigo-700">{user.nickname[0]}</span>
                  </div>
                  <span className="text-xs text-gray-700">{user.nickname}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{user.signupPath}</span>
                </li>
              ))}
              {MOCK_USERS.filter(u => u.joinedAt === (chartDayToDate[hoveredDate] ?? '')).length === 0 && (
                <li className="text-xs text-gray-400">데이터 없음</li>
              )}
            </ul>
            {/* 해당 날짜 신규 가입자 페이지로 이동 */}
            <button
              onClick={() => navigate('/admin/users/today')}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
            >
              전체 보기 →
            </button>
          </div>
        )}
      </div>

      {/* 거래 유형별 건수 — BarChart (날짜 범위 필터 적용) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-0.5">
          거래 유형별 건수
          <span className="text-xs font-normal text-gray-400 ml-2">
            {startDate} ~ {endDate}
          </span>
        </p>
        <p className="text-xs text-gray-400 mb-3">클릭하면 상세 목록을 볼 수 있어요</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={filteredTradeTypeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="type" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              name="건수"
              cursor="pointer"
              onClick={(data: { type: string }) => {
                const map: Record<string, string> = {
                  '중고거래': 'SELL',
                  '대여':     'RENT',
                  '나눔':     'SHARE',
                  '거래대행': 'ESCROW',
                }
                const tradeType = map[data.type]
                // 날짜 범위와 거래 유형 필터를 URL 파라미터로 전달
                if (tradeType) navigate(`/admin/trades?start=${startDate}&end=${endDate}&type=${tradeType}`)
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 상태 비율 — PieChart (날짜 범위 필터 적용) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          거래 상태 비율
          <span className="text-xs font-normal text-gray-400 ml-2">
            {startDate} ~ {endDate}
          </span>
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={filteredTradeStatusData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {filteredTradeStatusData.map((entry, i) => {
                // 거래 상태 한글 → 영문 키 매핑
                const statusKey: Record<string, string> = { '거래중': 'ACTIVE', '완료': 'COMPLETED', '취소': 'CANCELLED' }
                return (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    style={{ cursor: 'pointer' }}
                    // 날짜 범위와 거래 상태 필터를 URL 파라미터로 전달
                    onClick={() => navigate(`/admin/trades?start=${startDate}&end=${endDate}&status=${statusKey[entry.name] ?? ''}`)}
                  />
                )
              })}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

// ── 일반 유저 메뉴 목록 ──────────────────────────────────────────────────────

/** 일반 유저용 마이페이지 메뉴 항목 */
const MENU_ITEMS = [
  { label: '내 거래',   to: '/mypage/items' },
  { label: '찜 목록',   to: '/mypage/wishes' },
  { label: '리뷰 관리', to: '/reviews' },
  { label: '차단 목록', to: '/mypage/blocks' },
]

// ── 메인 MyPage 컴포넌트 ─────────────────────────────────────────────────────

/** 마이페이지: 관리자면 통계 대시보드, 일반 유저면 프로필·메뉴 표시 */
export default function MyPage() {
  const user                       = useAuthStore((s) => s.user)  // 현재 로그인 유저
  const { mutate: logout, isPending } = useLogout()               // 로그아웃 훅

  const isAdmin = user?.role === 'ADMIN'  // 관리자 여부 판단

  return (
    <div className="flex flex-col gap-4">

      {/* 관리자: 통계 대시보드 / 일반 유저: 프로필 + 메뉴 */}
      {isAdmin ? (
        <AdminStats nickname={user?.nickname ?? '관리자'} />
      ) : (
        <>
          {/* 일반 유저 프로필 */}
          <div className="flex items-center gap-4 py-2">
            {/* 프로필 이미지 */}
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {user?.profileImage && (
                <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{user?.nickname}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            {/* 프로필 수정 링크 */}
            <Link to="/mypage/edit" className="text-sm text-primary-500">수정</Link>
          </div>

          {/* 신뢰 지수 표시 바 */}
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
