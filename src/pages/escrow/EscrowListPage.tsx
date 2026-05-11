// 거래대행 신청 목록 — 본인 신청서
import { useNavigate } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, Truck, ArrowRight, PackageCheck } from 'lucide-react'
import { useMyEscrowApplications } from '@/features/escrow/hooks'
import type { EscrowApplication } from '@/features/escrow/types'
import { getEscrowDisplayStatus, ESCROW_DISPLAY_COLOR, type EscrowDisplayStatus } from '@/features/escrow/displayStatus'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

// 라운드13 — 통합 라벨 7단계 아이콘
//   ⚠ 목록은 deliveryId 가 null 이라 진행중 시 sub-status 미상 → '매칭중' fallback 으로 표시
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
            return (
              <li key={app.id}>
                <button
                  onClick={() => navigate(`/escrow/list/${app.id}`)}
                  className="w-full flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
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
                        {app.appliedTotalFee.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="text-gray-400 mt-1 shrink-0" size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
