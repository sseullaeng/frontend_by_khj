// 알림 페이지: 일반 유저는 알림 목록, 관리자는 전체 알림 발송 기능 포함
import { useState } from 'react'
import { Bell, Send, X } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 스토어
import { cn } from '@/shared/lib/cn'                  // 조건부 클래스 유틸

// 전체 발송 알림 유형
type BroadcastType = 'SYSTEM' | 'EVENT' | 'TRADE'

// 유형별 라벨·색상
const BROADCAST_TYPE_MAP: Record<BroadcastType, { label: string; cls: string }> = {
  SYSTEM: { label: '시스템',   cls: 'bg-gray-100 text-gray-700' },
  EVENT:  { label: '이벤트',   cls: 'bg-orange-100 text-orange-700' },
  TRADE:  { label: '거래',     cls: 'bg-blue-100 text-blue-700' },
}

// 샘플 발송 이력 (관리자 전용)
interface BroadcastLog {
  id: number
  type: BroadcastType
  title: string
  content: string
  sentAt: string
  targetCount: number
}

const SAMPLE_LOGS: BroadcastLog[] = [
  { id: 1, type: 'SYSTEM', title: '서비스 점검 안내', content: '4월 20일 새벽 2시 점검이 예정되어 있습니다.', sentAt: '2024-04-15 10:00', targetCount: 1284 },
  { id: 2, type: 'EVENT',  title: '여름 세일 시작!', content: '지금 최대 50% 할인 혜택을 누려보세요.', sentAt: '2024-04-10 09:00', targetCount: 1284 },
]

export default function NotificationPage() {
  const currentUser = useAuthStore((s) => s.user)  // 현재 로그인 유저
  const isAdmin = currentUser?.role === 'ADMIN'    // 관리자 여부

  // 관리자 전체 발송 폼 상태
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('SYSTEM')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  // 발송 이력 목록
  const [logs, setLogs] = useState<BroadcastLog[]>(SAMPLE_LOGS)

  /** 전체 알림 발송 처리 */
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return
    setSending(true)
    // 실제 구현 시 API 호출로 대체
    await new Promise((r) => setTimeout(r, 800))
    const newLog: BroadcastLog = {
      id: Date.now(),
      type: broadcastType,
      title: broadcastTitle,
      content: broadcastContent,
      sentAt: new Date().toLocaleString('ko-KR'),
      targetCount: 1284,
    }
    setLogs((prev) => [newLog, ...prev])
    setBroadcastTitle('')
    setBroadcastContent('')
    setSending(false)
    setSentSuccess(true)
    setTimeout(() => setSentSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <Bell className="text-primary-500" size={22} />
        <h1 className="text-xl font-bold text-gray-900">알림</h1>
      </div>

      {/* ── 관리자 전용: 전체 알림 발송 패널 ─────────────────────────────── */}
      {isAdmin && (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
          {/* 패널 헤더 */}
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <Send size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">전체 알림 발송</span>
            <span className="ml-auto text-xs text-amber-600">전체 회원에게 발송됩니다</span>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* 유형 선택 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">알림 유형</label>
              <div className="flex gap-2">
                {(Object.keys(BROADCAST_TYPE_MAP) as BroadcastType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBroadcastType(t)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                      broadcastType === t
                        ? cn(BROADCAST_TYPE_MAP[t].cls, 'border-current')
                        : 'text-gray-500 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {BROADCAST_TYPE_MAP[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="알림 제목을 입력하세요"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">내용</label>
              <textarea
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                placeholder="알림 내용을 입력하세요"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none"
              />
            </div>

            {/* 발송 버튼 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastTitle.trim() || !broadcastContent.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Send size={15} />
                {sending ? '발송 중...' : '전체 발송'}
              </button>
              {/* 발송 성공 메시지 */}
              {sentSuccess && (
                <span className="text-sm text-emerald-600 font-medium animate-fade-in">
                  ✓ 전체 회원에게 발송되었습니다
                </span>
              )}
            </div>
          </div>

          {/* 발송 이력 */}
          {logs.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="px-5 py-3 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500">발송 이력</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <li key={log.id} className="px-5 py-3 flex items-start gap-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', BROADCAST_TYPE_MAP[log.type].cls)}>
                      {BROADCAST_TYPE_MAP[log.type].label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{log.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{log.sentAt} · {log.targetCount.toLocaleString()}명</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 일반 알림 목록 (구현 예정) ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
        <Bell size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 text-sm font-medium">알림 목록 구현 예정</p>
        <p className="text-gray-300 text-xs mt-1">거래·채팅·시스템 알림이 여기에 표시됩니다</p>
      </div>

      {/* 닫기(읽기 처리) 아이콘 예시 — 실제 구현 시 목록 아이템에 사용 */}
      <div className="hidden"><X size={16} /></div>

    </div>
  )
}
