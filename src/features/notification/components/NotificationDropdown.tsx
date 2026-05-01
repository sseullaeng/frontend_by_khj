// 알림 드롭다운 컴포넌트: 알림 목록 표시 및 관리 기능
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'  // React Query 훅
import { Link } from 'react-router-dom'  // React Router의 Link 컴포넌트
import { notificationApi } from '../api'  // 알림 API
import { fromNow } from '@/shared/lib/date'  // 날짜 포맷팅 유틸리티

// 알림 드롭다운 props 타입
interface NotificationDropdownProps {
  onClose: () => void  // 드롭다운 닫기 함수
}

/**
 * 알림 드롭다운 컴포넌트
 * 
 * 기능:
 * - 알림 목록 조회 및 표시
 * - 전체 읽음 처리
 * - 개별 알림 읽음 상태 표시
 * - 알림 링크 연결
 * - 실시간 업데이트
 * 
 * UI 구조:
 * - 상단: 제목 및 전체 읽음 버튼
 * - 중단: 알림 목록
 * - 하단: 전체 알림 보기 링크
 */
export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const qc = useQueryClient()  // React Query 클라이언트

  // 알림 목록 조회
  const { data } = useQuery({
    queryKey: ['notifications', 'dropdown'],  // 쿼리 키
    queryFn: () => notificationApi.getList({ size: 10 }).then((r) => r.data),  // 최근 10개 알림 조회
  })

  // 전체 읽음 처리 뮤테이션
  const { mutate: markAllRead } = useMutation({
    mutationFn: notificationApi.markAllRead,  // 전체 읽음 API 호출
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),  // 알림 쿼리 무효화
  })

  return (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
      {/* 드롭다운 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm">알림</span>
        {/* 전체 읽음 버튼 */}
        <button
          onClick={() => markAllRead()}
          className="text-xs text-gray-400 hover:text-primary-500"
        >
          모두 읽음
        </button>
      </div>

      <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {data?.content.length === 0 && (
          <li className="py-8 text-center text-sm text-gray-400">알림이 없어요</li>
        )}
        {data?.content.map((n) => (
          <li key={n.id}>
            <Link
              to={n.linkUrl ?? '/notifications'}
              onClick={onClose}
              className={`flex flex-col gap-0.5 px-4 py-3 hover:bg-gray-50 ${
                !n.isRead ? 'bg-primary-50' : ''
              }`}
            >
              <span className="text-sm font-medium text-gray-900">{n.title}</span>
              <span className="text-xs text-gray-500 line-clamp-1">{n.body}</span>
              <span className="text-xs text-gray-400">{fromNow(n.createdAt)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/notifications"
        onClick={onClose}
        className="block text-center py-3 text-sm text-primary-500 font-medium border-t border-gray-100 hover:bg-gray-50"
      >
        전체 알림 보기
      </Link>
    </div>
  )
}
