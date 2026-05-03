// 관리자 신규 가입자 페이지: 달력 날짜 선택으로 특정 날짜 가입 회원 조회 — 백엔드 hook 연동
//
// 백엔드 useAdminUsers 가 날짜 필터 파라미터 미제공 → 1페이지(size=200) 받아서 클라이언트 필터.
// 추후 백엔드에 ?createdAfter=&createdBefore= 등 필터 추가되면 서버 쿼리로 교체.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft, CalendarSearch } from 'lucide-react'
import AdminUserListPanel from './components/AdminUserListPanel'
import { useAdminUsers } from '@/features/admin/hooks'
import { toPanelUser } from './lib/userAdapter'

export default function AdminTodayUsersPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)

  // 회원 전체 받아옴 (백엔드 날짜 필터 미지원 — 클라이언트 필터)
  const { data, isLoading } = useAdminUsers({ page: 0, size: 200 })
  const allUsers = useMemo(() => (data?.content ?? []).map(toPanelUser), [data])

  // 선택한 날짜 가입 회원
  const dateUsers = useMemo(
    () => allUsers.filter((u) => u.joinedAt === selectedDate),
    [allUsers, selectedDate],
  )

  // 가입 데이터 있는 날짜 (달력 빠른 선택용)
  const datesWithData = useMemo(
    () => [...new Set(allUsers.map((u) => u.joinedAt))].sort(),
    [allUsers],
  )

  return (
    <div className="pb-10">

      {/* 뒤로가기 + 페이지 제목 */}
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

      {/* 날짜 검색 카드 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarSearch size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-700">날짜 선택</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          min={datesWithData[0]}
          max={datesWithData[datesWithData.length - 1] || today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white"
        />
        {datesWithData.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">데이터 있는 날짜 빠른 선택</p>
            <div className="flex flex-wrap gap-1.5">
              {datesWithData.map((date) => {
                const [, m, d] = date.split('-')
                const count = allUsers.filter((u) => u.joinedAt === date).length
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedDate === date
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {parseInt(m)}/{parseInt(d)}
                    <span className={`ml-1 ${selectedDate === date ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {count}명
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 선택 날짜 요약 */}
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
                <p key={path} className="text-xs text-indigo-600">
                  {path} {count}명
                </p>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* 가입자 목록 */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : dateUsers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">{selectedDate}에 가입한 회원이 없습니다</p>
          <p className="text-xs mt-1 text-gray-300">다른 날짜를 선택해보세요</p>
        </div>
      ) : (
        <AdminUserListPanel users={dateUsers} />
      )}
    </div>
  )
}
