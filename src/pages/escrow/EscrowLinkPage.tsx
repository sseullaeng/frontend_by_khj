// 에스크로 링크 페이지 컴포넌트: 에스크로 신청 링크 생성 및 공유 기능
import { useState } from 'react'  // React 상태 훅
import { useNavigate } from 'react-router-dom'  // React Router 네비게이션 훅
import { Copy, Share2, CheckCircle, ArrowLeft } from 'lucide-react'  // Lucide 아이콘들
import { Button } from '@/shared/ui/Button'  // 버튼 컴포넌트

// 에스크로 링크 페이지 — 백엔드 미지원 (linkId 발급 endpoint 없음)
// TODO: 백엔드 spec 확정 후 실제 발급된 linkId 로 교체
export default function EscrowLinkPage() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  // linkId 백엔드 미발급 — 페이지 placeholder. 실 endpoint 추가되면 여기 호출.
  const generatedLink = `${window.location.origin}${import.meta.env.BASE_URL}escrow/join/PENDING`

  // 링크 복사 처리 함수
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)  // 클립보드에 링크 복사
      setCopied(true)  // 복사 완료 상태 설정
      setTimeout(() => setCopied(false), 2000)  // 2초 후 상태 초기화
    } catch {
      // 클립보드 API 미지원 시 무시
    }
  }

  // 링크 공유 처리 함수 (네이티브 공유 API)
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: '쓸랭 거래 대행 신청',  // 공유 제목
        text: '아래 링크를 통해 거래 대행 서비스를 함께 신청해 주세요.',  // 공유 설명
        url: generatedLink,  // 공유 링크
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

      {/* 성공 안내 */}
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

      {/* 링크 공유 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">공유 링크</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700 break-all font-mono flex-1 min-w-0">
            {generatedLink}
          </p>
          <Button
            onClick={handleCopy}
            variant={copied ? 'outline' : 'primary'}
            size="sm"
            className="shrink-0"
          >
            {copied ? (
              <><CheckCircle size={14} /> 복사됨</>
            ) : (
              <><Copy size={14} /> 복사</>
            )}
          </Button>
        </div>

        <Button onClick={handleShare} variant="outline" fullWidth>
          <Share2 size={16} />
          링크 공유하기
        </Button>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 rounded-xl p-5">
        <p className="font-medium text-blue-900 mb-3">이렇게 진행돼요</p>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">1.</span>
            <span>링크를 상대방에게 공유합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">2.</span>
            <span>상대방이 링크를 열어 역할과 수수료 방식을 확인합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0">3.</span>
            <span>정보가 일치하면 물품 등록과 배달지 설정을 진행합니다.</span>
          </li>
        </ul>
      </div>

      {/* 링크 정보 */}
      <div className="bg-gray-50 rounded-xl p-5 text-sm">
        <p className="font-medium text-gray-900 mb-3">링크 정보</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">유효 기간</span>
            <span className="text-gray-900">24시간</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">사용 가능 횟수</span>
            <span className="text-gray-900">1회</span>
          </div>
        </div>
      </div>

      <Button onClick={() => navigate('/escrow/list')} variant="outline" fullWidth>
        신청 목록 보기
      </Button>
    </div>
  )
}
