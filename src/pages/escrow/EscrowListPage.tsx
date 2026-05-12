// 거래대행 신청 목록 — 본인 신청서
//
// 라운드13 PR #129 — listMine 응답에 deliveryId 채워짐.
//   매칭된 항목은 카드의 [배달 추적] 버튼이 직접 /delivery/:deliveryId/track 으로 이동.
//   sub-status 자체는 N+1 회피로 카드별 호출 안 함 → '매칭중' fallback 표시 유지.
import { useNavigate } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, Truck, ArrowRight, PackageCheck } from 'lucide-react'
import { useMyEscrowApplications } from '@/features/escrow/hooks'
import type { EscrowApplication } from '@/features/escrow/types'
import { getEscrowDisplayStatus, ESCROW_DISPLAY_COLOR, type EscrowDisplayStatus } from '@/features/escrow/displayStatus'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const DISPLAY_ICON: Record<EscrowDisplayStatus, typeof Clock> = {
  '신청중':   Clock,
  '신청완료': CheckCircle,
  '매칭중':   Clock,
  '픽업중':   PackageCheck,
  '배달중':   Truck,
  '배달완료': CheckCircle,
  '취소':     XCircle,
}

export default function EscrowListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyEscrowApplications({ size: 50 })
  const items: EscrowApplication[] = data?.content ?? []

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">신청 목록</h1>
        <span className="text-sm text-gray-500">총 {items.length}건</span>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Shield size={48} className="mb-4 opacity-40" />
          <p className="text-sm">신청한 대행 서비스가 없습니다.</p>
          <p className="text-xs mt-1">대행 신청을 먼저 진행해 주세요.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((app) => {
            // 목록은 deliveryId 없음 → '진행중' 일 때 '매칭중' fallback
            const displayStatus = getEscrowDisplayStatus(app.status, undefined)
            const StatusIcon = DISPLAY_ICON[displayStatus]
            // 진행중·완료 + 매칭된 deliveryId 있을 때만 [배달 추적] 버튼
            const canTrack = !!app.deliveryId && (app.status === '진행중' || app.status === '완료')
            const goDetail = () => navigate(`/escrow/list/${app.id}`)
            return (
              <li key={app.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={goDetail}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goDetail() } }}
                  className="w-full flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {app.imageUrls.length > 0 ? (
                      <img src={app.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield size={20} className="text-gray-400 m-auto mt-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full', ESCROW_DISPLAY_COLOR[displayStatus])}>
                        <StatusIcon size={11} />
                        {displayStatus}
                      </span>
                      <span className="text-xs text-gray-400">#{app.id}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {app.tradeMode === 'INTERNAL' ? '쓸랭 거래' : '외부 거래'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 truncate">
                      {app.pickupAddress} → {app.deliveryAddress}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        신청일: {formatKst(app.createdAt, 'yyyy.MM.dd')}
                      </p>
                      <span className="font-medium text-gray-900 text-sm">
                        {/* 정보입력대기 단계 등은 fee 미산정 → '-' 표시 */}
                        {app.appliedTotalFee != null ? `${app.appliedTotalFee.toLocaleString()}원` : '-'}
                      </span>
                    </div>

                    {/* 라운드13 PR #129 — deliveryId 직접 사용, 배달 추적 페이지로 직행 */}
                    {canTrack && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/delivery/${app.deliveryId}/track`)
                        }}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <Truck size={11} />
                        배달 추적
                      </button>
                    )}
                  </div>

                  <ArrowRight className="text-gray-400 mt-1 shrink-0" size={18} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
