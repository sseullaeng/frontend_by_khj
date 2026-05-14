// 관리자 통계 대시보드 — recharts 기반.
// MyPage 에서 lazy 로드 → 일반 사용자 진입 시 recharts(~300KB) 다운로드 회피.
//
// 라운드12 — GET /api/v1/admin/stats/dashboard/charts 연동
//   기간 미지정 시 백엔드 default = 최근 14일.
//   TradeType:   '판매' | '대여' | '나눔'
//   TradeStatus: '진행중' | '완료' | '취소'  (백엔드에서 5단계 → 3분류 그룹핑)
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  useAdminCompletedTradeTypeCounts,
  useAdminDashboardCharts,
  useAdminMe,
} from '@/features/admin/hooks'
import { useAdminOverdueList } from '@/features/overdue/hooks'

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b']

// 차트 일자 라벨 — '2026-04-23' → '4/23'
function toChartDay(date: string) {
  const [, m, d] = date.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

// today-13 / today (YYYY-MM-DD, 로컬 KST)
function defaultRange(): { start: string; end: string } {
  const today = new Date()
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  const past = new Date(today)
  past.setDate(today.getDate() - 13)
  return { start: fmt(past), end: fmt(today) }
}

// nickname prop 은 옛 mypage 흐름과의 호환용 (PR #29 revert 잔재). 미지정 시
// useAdminMe 응답의 name 을 사용. admin/me 가 분리된 라운드13부터는 prop 없이도 동작.
export default function AdminStats({ nickname }: { nickname?: string } = {}) {
  const navigate = useNavigate()
  const init = useMemo(defaultRange, [])
  const [startDate, setStartDate] = useState(init.start)
  const [endDate,   setEndDate]   = useState(init.end)

  const { data: adminMe } = useAdminMe()
  const displayName = nickname ?? adminMe?.name ?? '관리자'

  const { data, isLoading, isError } = useAdminDashboardCharts(startDate, endDate)
  const completedTradeTypeCounts = useAdminCompletedTradeTypeCounts(startDate, endDate)

  // 차트용 가공
  const signupTrend = (data?.signupTrend ?? []).map((d) => ({
    day: toChartDay(d.date),
    fullDate: d.date,
    count: d.count,
  }))
  const tradeByType = completedTradeTypeCounts.data
  const tradeByStatus = (data?.tradeByStatus ?? []).map((d) => ({
    name: d.status,
    value: d.count,
  }))

  const summary = data?.summary
  const reportsSummary = data?.reportsSummary  // 라운드12 PR #106

  return (
    <div className="flex flex-col gap-6">

      {/* 관리자 헤더 */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <ShieldCheck size={22} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{displayName}</p>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">관리자</span>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-red-500 text-center py-3 bg-red-50 rounded-xl">
          통계를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {/* 라운드13 — 관리 메뉴 빠른 진입은 AdminConsole 사이드바로 이전. 통계 탭은 차트·요약만. */}

      {/* 요약 카드 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="전체 회원"
          value={summary ? `${summary.users.total.toLocaleString()}명` : '—'}
          sub={summary ? `이번 달 +${summary.users.monthDelta.toLocaleString()}` : ' '}
          onClick={() => navigate('/admin/users')}
        />
        <SummaryCard
          label="오늘 신규"
          value={summary ? `${summary.todaySignups.count.toLocaleString()}명` : '—'}
          sub={summary ? formatDelta('어제 대비', summary.todaySignups.yesterdayDelta) : ' '}
          onClick={() => navigate('/admin/users/today')}
        />
        <SummaryCard
          label="이번달 거래"
          value={summary ? `${summary.monthTrades.count.toLocaleString()}건` : '—'}
          sub={summary ? formatRate('저번달 대비', summary.monthTrades.prevMonthRate) : ' '}
          onClick={() => navigate('/admin/trades')}
        />
        <SummaryCard
          label="신고 대기"
          value={summary ? `${summary.pendingReports.toLocaleString()}건` : '—'}
          sub="미처리 신고"
          valueColor="text-red-500"
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      {/* 연체 위젯 — 라운드14. 진행 중 / 위험(PHASE_4) totalElements 만 사용. */}
      <OverdueSummary />

      {/* 신고 위젯 — 라운드12 PR #106. 응답에 있을 때만 노출 (백엔드 배포 후 자동 활성화) */}
      {reportsSummary && (
        <button
          onClick={() => navigate('/admin/reports')}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">신고 처리 현황</p>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ReportStat label="처리 대기"   value={reportsSummary.pending}        tone="red" />
            <ReportStat label="처리 완료"   value={reportsSummary.resolved}       tone="emerald" />
            <ReportStat label="최근 7일"    value={reportsSummary.totalLast7Days} tone="gray" />
          </div>
        </button>
      )}

      {/* 차트 공통 날짜 범위 */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">차트 조회 기간</p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400"
          />
          <span className="text-gray-400 text-sm shrink-0">~</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
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
        {isLoading ? (
          <ChartPlaceholder height={160} />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={signupTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
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
        )}
      </div>

      {/* 완료된 거래 유형별 건수 — BarChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-0.5">
          완료된 거래 유형별 건수
          <span className="text-xs font-normal text-gray-400 ml-2">{startDate} ~ {endDate}</span>
        </p>
        <p className="text-xs text-gray-400 mb-3">거래완료 상태의 판매·대여만 집계해요</p>
        {completedTradeTypeCounts.isLoading ? (
          <ChartPlaceholder height={160} />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={tradeByType} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                name="건수"
                cursor="pointer"
                onClick={(d: { type: string }) => {
                  // 백엔드 거래 검색은 한국어 enum 그대로 받음 (admin/api.ts AdminTransactionSearchParams)
                  navigate(
                    `/admin/trades?start=${startDate}&end=${endDate}&status=${encodeURIComponent('거래완료')}&type=${encodeURIComponent(d.type)}`
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        {completedTradeTypeCounts.isError && (
          <p className="mt-3 text-xs text-red-500">완료 거래 유형 집계를 불러오지 못했어요.</p>
        )}
      </div>

      {/* 거래 상태 비율 — PieChart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          거래 상태 비율
          <span className="text-xs font-normal text-gray-400 ml-2">{startDate} ~ {endDate}</span>
        </p>
        {isLoading ? (
          <ChartPlaceholder height={180} />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={tradeByStatus}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {tradeByStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {/*
          거래 상태 클릭 → trades 검색은 5단계 enum 받지만 백엔드가 '진행중' 으로 그룹핑해서
          내려주기 때문에 정확한 status 매칭이 모호. 일단 navigate 비활성 (필터 없이 trades 진입은 위 BarChart 에서 가능).
        */}
      </div>
    </div>
  )
}

// ── 보조 컴포넌트/유틸 ─────────────────────────────────────────────────────

// 라운드14 — 연체 현황 위젯. 백엔드 dashboard 응답에 합산 필드가 없어,
//   목록 endpoint 의 totalElements 만 가볍게(size=1) 끌어와 카운트 표시.
function OverdueSummary() {
  const navigate = useNavigate()
  const active = useAdminOverdueList({ status: '진행중', size: 1 })
  const danger = useAdminOverdueList({ phase: 'PHASE_4', size: 1 })

  const activeCount = active.data?.totalElements ?? 0
  const dangerCount = danger.data?.totalElements ?? 0
  const loading = active.isLoading || danger.isLoading

  return (
    <button
      onClick={() => navigate('/admin/overdue')}
      className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-red-500" /> 연체 현황
        </p>
        <ChevronRight size={14} className="text-gray-300" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ReportStat
          label="진행 중"
          value={loading ? 0 : activeCount}
          tone={activeCount > 0 ? 'red' : 'gray'}
        />
        <ReportStat
          label="위험 (4단계)"
          value={loading ? 0 : dangerCount}
          tone={dangerCount > 0 ? 'red' : 'gray'}
        />
      </div>
    </button>
  )
}

function ReportStat({
  label, value, tone,
}: {
  label: string
  value: number
  tone: 'red' | 'emerald' | 'gray'
}) {
  const palette = {
    red:     'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    gray:    'bg-gray-50 text-gray-700',
  }[tone]
  return (
    <div className={`rounded-lg py-2 px-3 ${palette}`}>
      <p className="text-[11px] opacity-80 mb-0.5">{label}</p>
      <p className="text-sm font-semibold">{value.toLocaleString()}건</p>
    </div>
  )
}


function SummaryCard({
  label, value, sub, valueColor = 'text-gray-900', onClick,
}: {
  label: string; value: string; sub: string; valueColor?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-xs text-gray-400">{sub}</p>
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </button>
  )
}

function ChartPlaceholder({ height }: { height: number }) {
  return (
    <div
      className="w-full bg-gray-50 rounded-lg animate-pulse"
      style={{ height }}
    />
  )
}

function formatDelta(prefix: string, delta: number) {
  if (delta === 0) return `${prefix} ±0`
  const sign = delta > 0 ? '+' : ''
  return `${prefix} ${sign}${delta.toLocaleString()}`
}

function formatRate(prefix: string, rate: number | null) {
  if (rate == null) return `${prefix} —`
  const sign = rate > 0 ? '+' : ''
  return `${prefix} ${sign}${(rate * 100).toFixed(0)}%`
}
