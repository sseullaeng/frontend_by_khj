// 관리자 신규 가입자 페이지: 달력 날짜 선택으로 특정 날짜 가입 회원 조회·관리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft, CalendarSearch } from 'lucide-react'
import AdminUserListPanel, {
  MOCK_ADMIN_USERS,
} from './components/AdminUserListPanel'  // 공용 회원 목록 패널

export default function AdminTodayUsersPage() {
  const navigate = useNavigate()

  // 조회 날짜 상태 (기본값: 가장 최근 목업 날짜)
  const [selectedDate, setSelectedDate] = useState('2026-05-02')

  // 선택한 날짜에 가입한 회원 필터링
  const dateUsers = MOCK_ADMIN_USERS.filter(u => u.joinedAt === selectedDate)

  // 전체 날짜 범위 중 데이터가 있는 날짜 목록 (달력 힌트용)
  const datesWithData = [...new Set(MOCK_ADMIN_USERS.map(u => u.joinedAt))].sort()

  return (
    <div className="pb-10">

      {/* 뒤로가기 버튼 + 페이지 제목 */}
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
        {/* 달력 입력 */}
        <input
          type="date"
          value={selectedDate}
          min={datesWithData[0]}
          max={datesWithData[datesWithData.length - 1]}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white"
        />
        {/* 데이터 있는 날짜 빠른 선택 칩 */}
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">데이터 있는 날짜 빠른 선택</p>
          <div className="flex flex-wrap gap-1.5">
            {datesWithData.map(date => {
              const [, m, d] = date.split('-')
              const count = MOCK_ADMIN_USERS.filter(u => u.joinedAt === date).length
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
      </div>

      {/* 선택 날짜 요약 카드 */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-500 mb-1">
            {selectedDate} 신규 가입
          </p>
          <p className="text-2xl font-bold text-indigo-700">{dateUsers.length}명</p>
        </div>
        {/* 가입 경로 분포 */}
        {dateUsers.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-indigo-400 mb-1">가입 경로</p>
            {(['이메일', '카카오', '네이버'] as const).map(path => {
              const count = dateUsers.filter(u => u.signupPath === path).length
              return count > 0 ? (
                <p key={path} className="text-xs text-indigo-600">
                  {path} {count}명
                </p>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* 가입자 목록 패널 (탭 필터 + 정지/복구/탈퇴 기능 포함) */}
      {dateUsers.length === 0 ? (
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
