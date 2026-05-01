// 차단 목록 페이지 컴포넌트 (UC-12: 차단 사용자 관리)
// 차단한 사용자 목록을 조회하고 차단 해제 / 신고 기능 제공

import { useState } from 'react'  // React 상태 훅
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { ChevronLeft, User, AlertTriangle, X } from 'lucide-react'  // Lucide 아이콘
import { useBlockList, useUnblock, useReportUser } from '@/features/block/hooks'  // 차단 관련 훅
import type { BlockedUser } from '@/features/item/types'  // 차단 사용자 타입

/**
 * 차단 일시 포맷팅 함수
 * ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 * @param dateStr - ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
function formatBlockedAt(dateStr: string): string {
  const d   = new Date(dateStr)
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

// 신고 사유 옵션 목록
const REPORT_REASONS = [
  '스팸 / 광고성 게시물',
  '욕설 / 혐오 표현',
  '사기 / 허위 정보',
  '개인정보 침해',
  '기타',
] as const

// 차단 목록 페이지 메인 컴포넌트
export default function BlockListPage() {
  const navigate = useNavigate()

  // 차단 목록 조회
  const { data, isLoading } = useBlockList()
  const blockedUsers = data ?? []

  // 차단 해제 뮤테이션
  const { mutate: unblock, isPending: isUnblocking } = useUnblock()

  // 신고 뮤테이션
  const { mutate: report, isPending: isReporting } = useReportUser()

  // 차단 해제 확인 모달 상태 (null: 닫힘, number: 대상 userId)
  const [confirmUnblockId, setConfirmUnblockId] = useState<number | null>(null)

  // 신고 모달 상태 (null: 닫힘, BlockedUser: 신고 대상)
  const [reportTarget, setReportTarget] = useState<BlockedUser | null>(null)

  // 신고 사유 선택 상태
  const [selectedReason, setSelectedReason] = useState<string>('')

  /**
   * 차단 해제 확인 핸들러
   * 확인 모달에서 "해제" 버튼 클릭 시 실행
   */
  const handleUnblockConfirm = () => {
    if (confirmUnblockId === null) return
    unblock(confirmUnblockId, {
      onSuccess: () => setConfirmUnblockId(null),  // 성공 시 모달 닫기
    })
  }

  /**
   * 신고 제출 핸들러
   * 신고 사유 선택 후 "신고하기" 버튼 클릭 시 실행
   */
  const handleReportSubmit = () => {
    if (!reportTarget || !selectedReason) return
    report(
      { userId: reportTarget.id, reason: selectedReason },
      {
        onSuccess: () => {
          // 신고 완료 후 모달 초기화
          setReportTarget(null)
          setSelectedReason('')
        },
      }
    )
  }

  /**
   * 신고 모달 닫기 핸들러
   */
  const handleReportClose = () => {
    setReportTarget(null)
    setSelectedReason('')
  }

  return (
    <div className="pb-10">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">차단 목록</h1>
        {/* 차단된 사용자 수 표시 */}
        <span className="text-sm text-gray-400 ml-auto">{blockedUsers.length}명</span>
      </div>

      {/* 차단 목록 영역 */}
      {isLoading ? (
        // 로딩 상태
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">차단 목록을 불러오는 중...</p>
        </div>
      ) : blockedUsers.length === 0 ? (
        // 빈 목록 상태
        <div className="text-center py-12">
          <User size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">차단한 사용자가 없습니다</p>
        </div>
      ) : (
        // 차단 사용자 목록 렌더링
        <ul className="space-y-3">
          {blockedUsers.map((user) => (
            <BlockedUserRow
              key={user.id}
              user={user}
              onUnblock={() => setConfirmUnblockId(user.id)}
              onReport={() => setReportTarget(user)}
            />
          ))}
        </ul>
      )}

      {/* 차단 해제 확인 모달 */}
      {confirmUnblockId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
            {/* 모달 제목 */}
            <h2 className="text-base font-bold text-gray-900 mb-2 text-center">차단 해제</h2>
            {/* 안내 문구 */}
            <p className="text-sm text-gray-500 text-center mb-6">
              이 사용자를 차단 해제하시겠습니까?<br />
              해제 후에는 다시 차단할 수 있습니다.
            </p>
            {/* 버튼 그룹 */}
            <div className="flex gap-3">
              {/* 취소 버튼 */}
              <button
                onClick={() => setConfirmUnblockId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              {/* 해제 확인 버튼 */}
              <button
                onClick={handleUnblockConfirm}
                disabled={isUnblocking}
                className="flex-1 py-2.5 bg-blue-500 rounded-xl text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isUnblocking ? '해제 중...' : '차단 해제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {reportTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                신고하기
              </h2>
              {/* 닫기 버튼 */}
              <button
                onClick={handleReportClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* 신고 대상 닉네임 */}
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-gray-800">{reportTarget.nickname}</span> 님을 신고합니다.
            </p>

            {/* 신고 사유 선택 목록 */}
            <p className="text-xs font-medium text-gray-600 mb-2">신고 사유 선택</p>
            <ul className="space-y-2 mb-6">
              {REPORT_REASONS.map((reason) => (
                <li key={reason}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    {/* 라디오 버튼 */}
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-red-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                </li>
              ))}
            </ul>

            {/* 버튼 그룹 */}
            <div className="flex gap-3">
              {/* 취소 버튼 */}
              <button
                onClick={handleReportClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              {/* 신고 제출 버튼 */}
              <button
                onClick={handleReportSubmit}
                disabled={!selectedReason || isReporting}
                className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {isReporting ? '신고 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 차단 사용자 행 컴포넌트 Props 타입 정의
interface BlockedUserRowProps {
  user:      BlockedUser  // 차단된 사용자 정보
  onUnblock: () => void   // 차단 해제 요청 핸들러
  onReport:  () => void   // 신고 요청 핸들러
}

/**
 * 차단 사용자 목록의 단일 행 컴포넌트
 * 프로필 사진, 닉네임, 차단일자, 차단해제/신고 버튼 표시
 */
function BlockedUserRow({ user, onUnblock, onReport }: BlockedUserRowProps) {
  return (
    <li className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
      {/* 프로필 이미지 영역 */}
      <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
        {user.profileImageUrl ? (
          // 프로필 이미지가 있을 때 표시
          <img
            src={user.profileImageUrl}
            alt={`${user.nickname} 프로필`}
            className="w-full h-full object-cover"
          />
        ) : (
          // 프로필 이미지 없을 때 기본 아이콘 표시
          <User size={22} className="text-gray-400" />
        )}
      </div>

      {/* 사용자 정보 영역 */}
      <div className="flex-1 min-w-0">
        {/* 닉네임 */}
        <p className="font-medium text-gray-900 text-sm truncate">{user.nickname}</p>
        {/* 차단 일자 */}
        <p className="text-xs text-gray-400 mt-0.5">
          차단일: {formatBlockedAt(user.blockedAt)}
        </p>
      </div>

      {/* 액션 버튼 그룹 */}
      <div className="flex flex-col gap-1.5 shrink-0">
        {/* 차단 해제 버튼 */}
        <button
          onClick={onUnblock}
          className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          차단 해제
        </button>

        {/* 신고하기 버튼 */}
        <button
          onClick={onReport}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
        >
          <AlertTriangle size={11} />
          신고하기
        </button>
      </div>
    </li>
  )
}
