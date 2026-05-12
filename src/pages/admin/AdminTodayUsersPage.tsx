// 관리자 신규 가입자 — 라운드13: 데이터 있는 날짜만 빠른 진입 칩
//   서버 daily 가입 트렌드 (signupTrend) 에서 count > 0 인 날짜를 칩으로 표시.
//   사용자는 칩 누르거나 직접 날짜 선택.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft, CalendarSearch } from 'lucide-react'
import AdminUserListPanel from './components/AdminUserListPanel'
import { useAdminUsers, useAdminDashboardCharts } from '@/features/admin/hooks'
import { toPanelUser } from './lib/userAdapter'
import { cn } from '@/shared/lib/cn'

// today-29 ~ today
function recentRange(): { start: string; end: string } {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date()
  const past = new Date(today)
  past.setDate(today.getDate() - 29)
  return { start: fmt(past), end: fmt(today) }
}

export default function AdminTodayUsersPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)

  // 최근 30일 daily 가입 트렌드 — 데이터 있는 날짜 추출용
  const { start, end } = useMemo(recentRange, [])
  const { data: charts } = useAdminDashboardCharts(start, end)
  const datesWithSignups = useMemo(() => {
    const list = (charts?.signupTrend ?? []).filter((d) => d.count > 0)
    // 최근 날짜가 먼저
    return [...list].reverse()
  }, [charts])

  // 선택 날짜 하루치 가입자
  const { data, isLoading } = useAdminUsers({
    createdAfter:  `${selectedDate}T00:00:00`,
    createdBefore: `${selectedDate}T23:59:59`,
    page: 0,
    size: 100,
  })
  const dateUsers = (data?.content ?? []).map(toPanelUser)

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <UserPlus size={20} className="text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">신규 가입자</h1>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarSearch size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-700">날짜 선택</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white"
        />

        {/* 데이터 있는 날짜 칩 — 최근 30일 중 가입자 있는 날만 */}
        {datesWithSignups.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] text-gray-500 mb-1.5">가입 있는 날 (최근 30일)</p>
            <div className="flex flex-wrap gap-1.5">
              {datesWithSignups.map((d) => {
                const sel = selectedDate === d.date
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                      sel
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
                    )}
                  >
                    {d.date.slice(5)} · {d.count}명
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-500 mb-1">{selectedDate} 신규 가입</p>
          <p className="text-2xl font-bold text-indigo-700">{dateUsers.length}명</p>
        </div>
        {dateUsers.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-indigo-400 mb-1">가입 경로</p>
            {(['이메일', '카카오', '구글'] as const).map((path) => {
              const count = dateUsers.filter((u) => u.signupPath === path).length
              return count > 0 ? (
                <p key={path} className="text-xs text-indigo-600">{path} {count}명</p>
              ) : null
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : dateUsers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">{selectedDate}에 가입한 회원이 없습니다</p>
          {datesWithSignups.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">위 칩에서 가입자 있는 날짜 선택해 보세요</p>
          )}
        </div>
      ) : (
        <AdminUserListPanel users={dateUsers} />
      )}
    </div>
  )
}
