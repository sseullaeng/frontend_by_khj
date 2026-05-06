// 거래대행 초대 진입 — 수신자가 링크 클릭 후 신청자 정보 확인
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Shield, AlertCircle, CheckCircle, Users } from 'lucide-react'
import { useEscrowLink } from '@/features/escrow/hooks'
import type { EscrowRole, FeePayer, TradeMode } from '@/features/escrow/types'
import { formatKst } from '@/shared/lib/date'
import { BusinessError } from '@/shared/types/api'

const ROLE_LABEL: Record<EscrowRole, string> = { buyer: '구매자', seller: '판매자' }
const FEE_LABEL:  Record<FeePayer, string>   = { buyer: '구매자 부담', seller: '판매자 부담', both: '반반 부담' }
const MODE_LABEL: Record<TradeMode, string>  = { INTERNAL: '쓸랭 거래', EXTERNAL: '외부 거래' }

export default function EscrowInvitePage() {
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()  // = linkToken (URL 호환성 위해 :linkId 유지)
  const linkToken = linkId

  const { data: link, isLoading, error } = useEscrowLink(linkToken)

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
  }

  if (error || !link) {
    const code = error instanceof BusinessError ? error.code : null
    const msg =
      code === 'ESCROW_LINK_EXPIRED'       ? '링크가 만료됐어요. 신청자에게 새 링크를 요청해 주세요.' :
      code === 'ESCROW_LINK_ALREADY_TAKEN' ? '이미 다른 사용자가 진행 중인 링크예요.' :
      code === 'ESCROW_LINK_NOT_FOUND'     ? '잘못된 링크예요.' :
      '링크 정보를 가져오지 못했어요.'

    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
        <p className="text-sm text-gray-700">{msg}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm text-primary-600 hover:underline"
        >
          홈으로
        </button>
      </div>
    )
  }

  // 수신자는 신청자와 반대 역할이 자동 부여됨 (백엔드가 결정)
  const myRole: EscrowRole = link.initiatorRole === 'buyer' ? 'seller' : 'buyer'

  const handleProceed = () => {
    navigate(`/escrow/join/${link.linkToken}/form`, { state: { link } })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">

      {/* 헤더 */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="text-primary-600" size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">거래대행 초대</h1>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{link.initiatorNickname}</span>님이 대행 서비스에 초대했어요.
        </p>
      </div>

      {/* 신청자 정보 */}
      <div className="bg-blue-50 rounded-xl p-5 mb-6">
        <h2 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          신청자 선택 내용
        </h2>
        <div className="space-y-2 text-sm">
          <Row label="신청자"        value={link.initiatorNickname} />
          <Row label="신청자 역할"   value={ROLE_LABEL[link.initiatorRole]} />
          <Row label="수수료 부담"   value={FEE_LABEL[link.feePayer]} />
          <Row label="거래 모드"     value={MODE_LABEL[link.tradeMode]} />
          <Row label="링크 만료"     value={formatKst(link.expiresAt, 'yyyy.MM.dd HH:mm')} />
        </div>
      </div>

      {/* 자동 부여된 내 역할 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="text-green-600 mt-0.5 shrink-0" size={20} />
        <div className="text-sm">
          <p className="font-medium text-green-900 mb-1">내 역할: {ROLE_LABEL[myRole]}</p>
          <p className="text-green-700">
            신청자가 {ROLE_LABEL[link.initiatorRole]} 이므로 자동으로 {ROLE_LABEL[myRole]} 로 진행돼요.
            물품/배달지 정보를 입력하면 결제까지 진행할 수 있어요.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto">
          <Button onClick={handleProceed} fullWidth>
            확인하고 신청서 작성하기
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-blue-700">{label}</span>
      <span className="font-medium text-blue-900">{value}</span>
    </div>
  )
}
