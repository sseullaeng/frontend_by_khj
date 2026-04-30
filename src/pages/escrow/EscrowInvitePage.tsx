import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { escrowStartSchema, type EscrowStartRequest, type EscrowRole, type FeePayer } from '@/features/escrow/types'
import { Button } from '@/shared/ui/Button'
import { Shield, Users, AlertCircle, CheckCircle } from 'lucide-react'

// TODO: API 연동 시 linkId로 서버에서 조회
const MOCK_LINK_DATA = {
  initiatorRole: 'buyer' as EscrowRole,
  feePayer: 'buyer' as FeePayer,
  initiatorName: '김철수',
  expiresAt: '2026-05-01T10:00:00Z',
}

const ROLE_OPTIONS = [
  { value: 'buyer' as const, label: '구매자', desc: '상대방에게 물품을 구매합니다.' },
  { value: 'seller' as const, label: '판매자', desc: '상대방에게 물품을 판매합니다.' },
]

const FEE_OPTIONS = [
  { value: 'buyer' as const, label: '구매자가 부담', desc: '수수료 전액을 구매자가 냅니다.' },
  { value: 'seller' as const, label: '판매자가 부담', desc: '수수료 전액을 판매자가 냅니다.' },
  { value: 'both' as const, label: '반반 부담', desc: '수수료를 구매자·판매자가 절반씩 냅니다.' },
]

const ROLE_LABEL: Record<EscrowRole, string> = { buyer: '구매자', seller: '판매자' }
const FEE_LABEL: Record<FeePayer, string> = { buyer: '구매자 부담', seller: '판매자 부담', both: '반반 부담' }

export default function EscrowInvitePage() {
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()
  const [linkData] = useState(MOCK_LINK_DATA)

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<EscrowStartRequest>({
    resolver: zodResolver(escrowStartSchema),
    mode: 'onChange',
  })

  const selectedRole = watch('role')
  const selectedFeePayer = watch('feePayer')

  // 신청자와 반대 역할이어야 하고, 수수료 방식은 동일해야 함
  const expectedRole: EscrowRole = linkData.initiatorRole === 'buyer' ? 'seller' : 'buyer'
  const isRoleMatch = selectedRole === expectedRole
  const isFeeMatch = selectedFeePayer === linkData.feePayer
  const isMatch = isRoleMatch && isFeeMatch

  const onSubmit = (data: EscrowStartRequest) => {
    if (!isMatch) return
    console.log('invite confirmed:', data)
    navigate(`/escrow/join/${linkId}/form`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      {/* 헤더 */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="text-primary-600" size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">거래 대행 초대</h1>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{linkData.initiatorName}</span>님이 대행 서비스에 초대했습니다.
        </p>
      </div>

      {/* 신청자 정보 */}
      <div className="bg-blue-50 rounded-xl p-5 mb-6">
        <h2 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          신청자 선택 내용
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">신청자</span>
            <span className="font-medium text-blue-900">{linkData.initiatorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">신청자 역할</span>
            <span className="font-medium text-blue-900">{ROLE_LABEL[linkData.initiatorRole]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">수수료 부담</span>
            <span className="font-medium text-blue-900">{FEE_LABEL[linkData.feePayer]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">링크 만료</span>
            <span className="font-medium text-blue-900">
              {new Date(linkData.expiresAt).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {/* 역할 선택 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">나는 어떤 역할인가요?</h2>
          <p className="text-xs text-gray-400 mb-3">신청자와 반대 역할을 선택해야 합니다.</p>
          <div className="flex flex-col gap-3">
            {ROLE_OPTIONS.map(({ value, label, desc }) => (
              <label key={value} className="block cursor-pointer">
                <input type="radio" value={value} {...register('role')} className="sr-only" />
                <div className={`p-4 rounded-xl border-2 transition-colors ${
                  selectedRole === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedRole === value ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {selectedRole === value && <div className="w-3 h-3 rounded-full bg-primary-500" />}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.role && <p className="text-xs text-red-500 mt-2">{errors.role.message}</p>}
        </div>

        {/* 수수료 확인 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">수수료 부담 방식 확인</h2>
          <p className="text-xs text-gray-400 mb-3">신청자가 선택한 방식과 동일하게 선택해야 합니다.</p>
          <div className="flex flex-col gap-3">
            {FEE_OPTIONS.map(({ value, label, desc }) => (
              <label key={value} className="block cursor-pointer">
                <input type="radio" value={value} {...register('feePayer')} className="sr-only" />
                <div className={`p-4 rounded-xl border-2 transition-colors ${
                  selectedFeePayer === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 mb-0.5">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedFeePayer === value ? 'border-primary-500' : 'border-gray-300'
                    }`}>
                      {selectedFeePayer === value && <div className="w-3 h-3 rounded-full bg-primary-500" />}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.feePayer && <p className="text-xs text-red-500 mt-2">{errors.feePayer.message}</p>}
        </div>

        {/* 일치 여부 피드백 */}
        {selectedRole && selectedFeePayer && (
          <div className={`rounded-xl p-4 border ${
            isMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {isMatch
                ? <CheckCircle className="text-green-600 mt-0.5 shrink-0" size={20} />
                : <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />}
              <div className="text-sm">
                <p className={`font-medium mb-1 ${isMatch ? 'text-green-900' : 'text-red-900'}`}>
                  {isMatch ? '정보가 일치합니다.' : '정보가 일치하지 않습니다.'}
                </p>
                {!isRoleMatch && (
                  <p className="text-red-700">
                    역할: {ROLE_LABEL[selectedRole]} → 상대방은 {ROLE_LABEL[expectedRole]}을 선택해야 합니다.
                  </p>
                )}
                {!isFeeMatch && (
                  <p className="text-red-700">
                    수수료: {FEE_LABEL[selectedFeePayer]} → 신청자는 {FEE_LABEL[linkData.feePayer]}을 선택했습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <Button type="submit" fullWidth disabled={!isValid || !isMatch}>
              {isMatch ? '확인 완료 — 물품 등록하기' : '정보를 올바르게 선택해 주세요'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
