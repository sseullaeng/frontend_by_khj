// 관리자 통계 대시보드 — recharts 기반.
// MyPage 에서 lazy 로드 → 일반 사용자 진입 시 recharts(~300KB) 다운로드 회피.
//
// TODO: 백엔드 admin/stats endpoint 합의 후 mock 데이터 제거하고 useAdminDashboard 등으로 교체.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── 타입 정의 ────────────────────────────────────────────────────────────────

type UserStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'WITHDRAWN'
type TradeType = 'SELL' | 'RENT' | 'SHARE' | 'ESCROW'
type TradeStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

interface AdminUser {
  id: number
  profileImageUrl: string | null
  nickname: string
  memberId: string
  signupPath: string
  trustScore: number
  tradeCount: number
  joinedAt: string
  reportCount: number
  status: UserStatus
  suspendedAt?: string
  suspendDays?: number
}

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

const MOCK_TRADES: AdminTrade[] = [
  { id: 1,  itemImageUrl: null, itemTitle: '아이폰 15 Pro',       itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 1100000, buyerNickname: '홍길동',     sellerNickname: '이철수',     date: '2026-05-02' },
  { id: 2,  itemImageUrl: null, itemTitle: '캠핑 텐트 대여',       itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 25000,   buyerNickname: '최수진',     sellerNickname: '테스트유저', date: '2026-05-01' },
  { id: 3,  itemImageUrl: null, itemTitle: '어린이 장난감',        itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '정우성',     sellerNickname: '손예진',     date: '2026-05-01' },
  { id: 4,  itemImageUrl: null, itemTitle: '맥북 에어 M2',         itemType: 'SELL',   tradeStatus: 'ACTIVE',    price: 1400000, buyerNickname: '강동원',     sellerNickname: '유재석',     date: '2026-04-30' },
  { id: 5,  itemImageUrl: null, itemTitle: '전동 킥보드',          itemType: 'RENT',   tradeStatus: 'CANCELLED', price: 15000,   buyerNickname: '박민준',     sellerNickname: '최수진',     date: '2026-04-30' },
  { id: 6,  itemImageUrl: null, itemTitle: '타 플랫폼 거래 대행',  itemType: 'ESCROW', tradeStatus: 'ACTIVE',    price: 350000,  buyerNickname: '테스트유저', sellerNickname: '홍길동',     date: '2026-04-29' },
  { id: 7,  itemImageUrl: null, itemTitle: '빈티지 자켓',          itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 45000,   buyerNickname: '김영희',     sellerNickname: '정우성',     date: '2026-04-29' },
  { id: 8,  itemImageUrl: null, itemTitle: 'DSLR 카메라 대여',     itemType: 'RENT',   tradeStatus: 'COMPLETED', price: 80000,   buyerNickname: '이철수',     sellerNickname: '강동원',     date: '2026-04-28' },
  { id: 9,  itemImageUrl: null, itemTitle: '아기 옷 나눔',         itemType: 'SHARE',  tradeStatus: 'COMPLETED', price: 0,       buyerNickname: '손예진',     sellerNickname: '유재석',     date: '2026-04-28' },
  { id: 10, itemImageUrl: null, itemTitle: 'PS5 본체',             itemType: 'SELL',   tradeStatus: 'CANCELLED', price: 680000,  buyerNickname: '신동엽',     sellerNickname: '이철수',     date: '2026-04-27' },
  { id: 11, itemImageUrl: null, itemTitle: '자전거 대여',          itemType: 'RENT',   tradeStatus: 'ACTIVE',    price: 10000,   buyerNickname: '최수진',     sellerNickname: '테스트유저', date: '2026-04-27' },
  { id: 12, itemImageUrl: null, itemTitle: '전자레인지',           itemType: 'SELL',   tradeStatus: 'COMPLETED', price: 55000,   buyerNickname: '정우성',     sellerNickname: '손예진',     date: '2026-04-26' },
]

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b']

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function AdminStats({ nickname }: { nickname: string }) {
  const navigate = useNavigate()
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const hideTimerRef = useRef<number>(0)

  const withdrawnCount = MOCK_USERS.filter(u => u.status === 'WITHDRAWN').length

  const [startDate, setStartDate] = useState('2026-04-23')
  const [endDate,   setEndDate]   = useState('2026-05-02')

  const toChartDay = (date: string) => {
    const [, m, d] = date.split('-')
    return `${parseInt(m)}/${parseInt(d)}`
  }

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

  const chartDayToDate: Record<string, string> = Object.fromEntries(
    filteredSignupChartData.map(d => [d.day, d.fullDate])
  )

  const filteredTradesInRange = MOCK_TRADES.filter(
    t => t.date >= startDate && t.date <= endDate
  )

  const filteredTradeTypeData = [
    { type: '중고거래', count: filteredTradesInRange.filter(t => t.itemType === 'SELL').length },
    { type: '대여',     count: filteredTradesInRange.filter(t => t.itemType === 'RENT').length },
    { type: '나눔',     count: filteredTradesInRange.filter(t => t.itemType === 'SHARE').length },
    { type: '거래대행', count: filteredTradesInRange.filter(t => t.itemType === 'ESCROW').length },
  ]

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

      {/* 요약 카드 2×2 그리드 */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* 차트 공통 날짜 범위 */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">차트 조회 기간</p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={e => setStartDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400"
          />
          <span className="text-gray-400 text-sm shrink-0">~</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* 일별 신규 가입자 — AreaChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          일별 신규 가입자
          <span className="text-xs font-normal text-gray-400 ml-2">{startDate} ~ {endDate}</span>
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={filteredSignupChartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            onMouseMove={(data: { activeLabel?: string }) => {
              window.clearTimeout(hideTimerRef.current)
              if (data.activeLabel) setHoveredDate(data.activeLabel)
            }}
            onMouseLeave={() => {
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

        {hoveredDate !== null && (
          <div
            className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
            onMouseEnter={() => window.clearTimeout(hideTimerRef.current)}
            onMouseLeave={() => { hideTimerRef.current = window.setTimeout(() => setHoveredDate(null), 400) }}
          >
            <p className="text-xs font-semibold text-indigo-700 mb-2">{hoveredDate} 가입자</p>
            <ul className="space-y-1">
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
            <button
              onClick={() => navigate('/admin/users/today')}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
            >
              전체 보기 →
            </button>
          </div>
        )}
      </div>

      {/* 거래 유형별 건수 — BarChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-0.5">
          거래 유형별 건수
          <span className="text-xs font-normal text-gray-400 ml-2">{startDate} ~ {endDate}</span>
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
                if (tradeType) navigate(`/admin/trades?start=${startDate}&end=${endDate}&type=${tradeType}`)
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 거래 상태 비율 — PieChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          거래 상태 비율
          <span className="text-xs font-normal text-gray-400 ml-2">{startDate} ~ {endDate}</span>
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
                const statusKey: Record<string, string> = { '거래중': 'ACTIVE', '완료': 'COMPLETED', '취소': 'CANCELLED' }
                return (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    style={{ cursor: 'pointer' }}
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
