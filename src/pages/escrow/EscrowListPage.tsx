// 신청 목록 — 본인이 요청한 배달대행 (= 거래대행) 목록
//
// 명칭은 "거래대행" 이지만 실제 도메인은 배달대행 (/api/v1/deliveries/me).
// useMyDeliveries() 호출 → Delivery 응답을 신청 목록 UI 로 매핑.
import { useNavigate } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, Truck, ArrowRight } from 'lucide-react'
import { useMyDeliveries } from '@/features/delivery/hooks'
import type { Delivery, DeliveryStatus } from '@/features/delivery/types'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_CFG: Record<DeliveryStatus, { label: string; color: string; icon: typeof Clock }> = {
  '모집중':   { label: '신청 중',     color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  '수락':     { label: '확인 완료',   color: 'text-blue-600 bg-blue-100',     icon: CheckCircle },
  '배송중':   { label: '대행 진행 중', color: 'text-orange-600 bg-orange-100', icon: Truck },
  '배송완료': { label: '배송 완료',   color: 'text-emerald-600 bg-emerald-100', icon: CheckCircle },
  '정산완료': { label: '정산 완료',   color: 'text-green-600 bg-green-100',   icon: CheckCircle },
  '취소':     { label: '취소',         color: 'text-red-600 bg-red-100',       icon: XCircle },
}

export default function EscrowListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyDeliveries({ size: 50 })
  const items: Delivery[] = data?.content ?? []

  return (
    <div className="px-4 py-8">
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
          {items.map((d) => {
            const cfg = STATUS_CFG[d.status]
            const StatusIcon = cfg.icon
            return (
              <li key={d.id}>
                <button
                  onClick={() => navigate(`/delivery/${d.id}/track`)}
                  className="w-full flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Truck size={20} className="text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full', cfg.color)}>
                        <StatusIcon size={11} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">#{d.id}</span>
                    </div>

                    <p className="font-medium text-gray-900 truncate mb-1">
                      {d.itemDescription}
                    </p>

                    <p className="text-xs text-gray-500 truncate">
                      {d.pickupAddress} → {d.dropoffAddress}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        신청일: {formatKst(d.requestedAt, 'yyyy.MM.dd')}
                      </p>
                      <span className="font-medium text-gray-900 text-sm">
                        {d.fee.toLocaleString()}원
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
