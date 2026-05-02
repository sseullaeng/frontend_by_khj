// 공지사항/새소식/이벤트 페이지: 관리자는 글쓰기·삭제 가능
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, Tag, ChevronRight, PenLine, Trash2, X } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'  // 인증 상태 스토어
import { cn } from '@/shared/lib/cn'                  // 조건부 클래스 유틸

// 공지 타입: 이벤트 / 새소식 / 공지사항
type NoticeType = 'event' | 'news' | 'notice'

// 공지 아이템 인터페이스
interface NoticeItem {
  id: number
  title: string
  content: string
  type: NoticeType
  date: string
  isRead: boolean
  tags?: string[]
}

// 타입별 라벨·색상 맵
const TYPE_MAP: Record<NoticeType, { label: string; cls: string }> = {
  event:  { label: '이벤트',   cls: 'bg-orange-100 text-orange-700' },
  news:   { label: '새소식',   cls: 'bg-emerald-100 text-emerald-700' },
  notice: { label: '공지사항', cls: 'bg-blue-100 text-blue-700' },
}

// 필터 탭 목록
const FILTER_TABS: { key: 'all' | NoticeType; label: string }[] = [
  { key: 'all',    label: '전체' },
  { key: 'event',  label: '이벤트' },
  { key: 'news',   label: '새소식' },
  { key: 'notice', label: '공지사항' },
]

// 초기 샘플 공지 데이터
const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 1,
    title: '2024 여름 세일',
    content: '선택된 상품 최대 50% 할인을 즐겨보세요!',
    type: 'event',
    date: '2024-04-15',
    isRead: false,
    tags: ['세일', '여름'],
  },
  {
    id: 2,
    title: '새로운 기능 추가',
    content: '더 나은 사용자 경험을 위해 새로운 기능이 추가되었습니다.',
    type: 'news',
    date: '2024-04-10',
    isRead: true,
    tags: ['업데이트', '기능'],
  },
  {
    id: 3,
    title: '시스템 점검 공지',
    content: '4월 20일 예정된 시스템 점검이 있습니다.',
    type: 'notice',
    date: '2024-04-08',
    isRead: true,
    tags: ['점검'],
  },
]

// ─── 관리자 글쓰기 폼 상태 타입
interface WriteForm {
  title: string
  content: string
  type: NoticeType
  tagInput: string  // 콤마 구분 태그 입력
}

export default function NoticePage() {
  const currentUser = useAuthStore((s) => s.user)  // 현재 로그인 유저
  const isAdmin = currentUser?.role === 'ADMIN'    // 관리자 여부

  // 공지 목록 상태 (관리자 추가·삭제 반영)
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES)
  // 필터 탭 상태
  const [selectedType, setSelectedType] = useState<'all' | NoticeType>('all')
  // 관리자 글쓰기 모달
  const [writeOpen, setWriteOpen] = useState(false)
  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  // 다음 ID 카운터
  const [nextId, setNextId] = useState(4)

  // 글쓰기 폼 상태
  const [form, setForm] = useState<WriteForm>({
    title: '', content: '', type: 'notice', tagInput: '',
  })

  // 필터 적용
  const filteredNotices = notices.filter(
    (n) => selectedType === 'all' || n.type === selectedType
  )

  /** 공지 삭제 처리 */
  const handleDelete = (id: number) => {
    setNotices((prev) => prev.filter((n) => n.id !== id))
    setDeleteTarget(null)
  }

  /** 공지 등록 처리 */
  const handleWrite = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const tags = form.tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const today = new Date().toISOString().split('T')[0]
    setNotices((prev) => [
      { id: nextId, title: form.title, content: form.content, type: form.type, date: today, isRead: false, tags },
      ...prev,
    ])
    setNextId((n) => n + 1)
    setForm({ title: '', content: '', type: 'notice', tagInput: '' })
    setWriteOpen(false)
  }

  return (
    <div className="space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="text-primary-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">새소식/이벤트</h1>
        </div>
        {/* 관리자 글쓰기 버튼 */}
        {isAdmin && (
          <button
            onClick={() => setWriteOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PenLine size={15} /> 글쓰기
          </button>
        )}
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              selectedType === key
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 공지 목록 */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div key={notice.id} className="relative group">
            <Link
              to={`/notices/${notice.id}`}
              className="block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 타입 배지 + 읽음 여부 + 날짜 */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', TYPE_MAP[notice.type].cls)}>
                        {TYPE_MAP[notice.type].label}
                      </span>
                      {!notice.isRead && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                      <span className="text-sm text-gray-500">{notice.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{notice.title}</h3>
                    {notice.tags && notice.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Tag size={14} className="text-gray-400" />
                        <div className="flex gap-1 flex-wrap">
                          {notice.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-gray-600 line-clamp-2">{notice.content}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            </Link>

            {/* 관리자 삭제 버튼 (카드 우상단 오버레이) */}
            {isAdmin && (
              <button
                onClick={(e) => { e.preventDefault(); setDeleteTarget(notice.id) }}
                className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg"
                aria-label="삭제"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="text-center py-12">
          <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">게시글이 없습니다</p>
        </div>
      )}

      {/* ── 관리자 글쓰기 모달 ─────────────────────────────────────────────── */}
      {writeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">새 글 작성</h3>
              <button onClick={() => setWriteOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* 유형 선택 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">유형</label>
                <div className="flex gap-2">
                  {(['notice', 'news', 'event'] as NoticeType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                        form.type === t
                          ? cn(TYPE_MAP[t].cls, 'border-current')
                          : 'text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {TYPE_MAP[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="제목을 입력하세요"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="내용을 입력하세요"
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none"
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  태그 <span className="font-normal text-gray-400">(콤마로 구분)</span>
                </label>
                <input
                  type="text"
                  value={form.tagInput}
                  onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                  placeholder="예: 점검, 업데이트"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setWriteOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleWrite}
                disabled={!form.title.trim() || !form.content.trim()}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ─────────────────────────────────────────────────── */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">게시글을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 게시글은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
