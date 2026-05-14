// 거래대행 링크 공유 — EscrowStartPage 의 useCreateEscrowLink 결과를 location.state 로 받음
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Copy, Share2, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { formatKst } from '@/shared/lib/date'
import type { EscrowLink } from '@/features/escrow/types'

export default function EscrowLinkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [copied, setCopied] = useState(false)

  // EscrowStartPage 에서 navigate(state) 로 전달받은 link
  const link = (location.state as { link?: EscrowLink } | null)?.link

  if (!link) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500 mb-4">링크 정보가 없어요. 처음부터 다시 진행해 주세요.</p>
        <Button onClick={() => navigate('/escrow/apply')}>대행 신청 시작</Button>
      </div>
    )
  }

  const generatedLink = `${window.location.origin}/escrow/join/${link.linkToken}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 미지원
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: '쓸랭 거래대행 신청',
        text: '아래 링크를 통해 거래대행 서비스를 함께 신청해 주세요.',
        url: generatedLink,
      }).catch(() => null)
    } else {
      handleCopy()
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors text-sm w-fit"
      >
        <ArrowLeft size={18} />
        이전으로
      </button>

      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">링크가 생성됐어요!</h1>
        <p className="text-sm text-gray-500">
          아래 링크를 상대방에게 공유하면<br />
          상대방이 정보를 확인하고 대행 신청이 완료됩니다.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">공유 링크</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700 break-all font-mono flex-1 min-w-0">
            {generatedLink}
          </p>
          <Button onClick={handleCopy} variant={copied ? 'outline' : 'primary'} size="sm" className="shrink-0">
            {copied ? <><CheckCircle size={14} /> 복사됨</> : <><Copy size={14} /> 복사</>}
          </Button>
        </div>

        <Button onClick={handleShare} variant="outline" fullWidth>
          <Share2 size={16} />
          링크 공유하기
        </Button>
      </div>

      {/* 링크 분실 시 재신청 필요 안내 — 이 페이지를 나가면 link 객체를 다시 못 받음 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900 mb-0.5">링크는 지금 꼭 저장해 주세요</p>
          <p className="text-xs text-amber-700/90 leading-relaxed">
            이 페이지를 벗어나면 같은 링크를 다시 볼 수 없어요. 잃어버리면 처음부터 다시 신청해야 하니
            지금 복사·공유로 보관해 주세요.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-5">
        <p className="font-medium text-blue-900 mb-3">이렇게 진행돼요</p>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">1.</span>
            <span>링크를 상대방에게 공유합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">2.</span>
            <span>상대방이 링크를 열어 정보를 확인합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">3.</span>
            <span>물품 / 배달지 / 옵션 입력 후 결제까지 진행합니다.</span>
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 text-sm">
        <p className="font-medium text-gray-900 mb-3">링크 정보</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">만료</span>
            <span className="text-gray-900">{formatKst(link.expiresAt, 'yyyy.MM.dd HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">사용 가능 횟수</span>
            <span className="text-gray-900">1회</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">거래 모드</span>
            <span className="text-gray-900">{link.tradeMode === 'INTERNAL' ? '쓸랭 거래' : '외부 거래'}</span>
          </div>
        </div>
      </div>

      <Button onClick={() => navigate('/escrow/list')} variant="outline" fullWidth>
        신청 목록 보기
      </Button>
    </div>
  )
}
