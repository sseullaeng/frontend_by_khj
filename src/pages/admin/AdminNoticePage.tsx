// 관리자 — 전체 유저 알림 발송 (라운드13)
//
// 사이드바 라벨 '공지' → '알림' 으로 변경.
//   POST /api/v1/admin/notifications/broadcast — 전체 유저(또는 특정 role) 에게 알림 발송.
//   카테고리 SYSTEM 으로 분류되어 사용자 알림 페이지의 [시스템] 탭에 노출.
import { useState } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { useBroadcastNotification } from '@/features/admin/hooks'
import { Button } from '@/shared/ui/Button'
import { toast } from 'sonner'

type TargetRole = 'ALL' | 'USER'

const TARGET_OPTIONS: { value: TargetRole; label: string; desc: string }[] = [
  { value: 'ALL',  label: '전체',     desc: '관리자 포함 모든 회원' },
  { value: 'USER', label: '일반 회원', desc: '관리자 제외 일반 유저만' },
]

export default function AdminNoticePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<TargetRole>('ALL')

  const { mutateAsync, isPending } = useBroadcastNotification()

  const handleSubmit = async () => {
    if (!title.trim() || title.length < 2) {
      toast.error('제목은 2자 이상 입력해 주세요.')
      return
    }
    if (!content.trim() || content.length < 5) {
      toast.error('내용은 5자 이상 입력해 주세요.')
      return
    }
    try {
      await mutateAsync({
        title: title.trim(),
        content: content.trim(),
        targetRole: target === 'ALL' ? undefined : target,
      })
      setTitle('')
      setContent('')
    } catch {
      // hook 토스트
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Megaphone size={20} className="text-primary-500" />
        <h1 className="text-xl font-bold text-gray-900">알림 발송</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        전체 유저에게 시스템 알림을 발송해요. 사용자 알림 페이지의 [시스템] 탭에 노출됩니다.
      </p>

      <div className="flex flex-col gap-4">
        <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">발송 대상</p>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setTarget(o.value)}
                className={
                  'p-3 rounded-xl border-2 text-left transition-colors ' +
                  (target === o.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50')
                }
              >
                <p className="font-medium text-gray-900 mb-0.5 text-sm">{o.label}</p>
                <p className="text-xs text-gray-500">{o.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="알림 제목"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500"
            />
            <p className="text-[11px] text-gray-400 text-right mt-0.5">{title.length}/100</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={6}
              placeholder="알림 본문 (1000자 이내)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 resize-none"
            />
            <p className="text-[11px] text-gray-400 text-right mt-0.5">{content.length}/1000</p>
          </div>
        </section>

        <Button
          type="button"
          fullWidth
          onClick={handleSubmit}
          isLoading={isPending}
          disabled={isPending || !title.trim() || !content.trim()}
        >
          <Send size={14} className="mr-1.5" />
          {target === 'ALL' ? '전체 유저' : '일반 회원'} 에게 발송
        </Button>
        <p className="text-xs text-gray-400 text-center">
          ⚠ 발송 후 취소 불가. 사용자가 즉시 알림을 받습니다.
        </p>
      </div>
    </div>
  )
}
