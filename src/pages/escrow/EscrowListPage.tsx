// 거래대행 신청 목록 — 본인 신청서
import { useNavigate } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, Truck, ArrowRight } from 'lucide-react'
import { useMyEscrowApplications } from '@/features/escrow/hooks'
import type { EscrowApplication, EscrowApplicationStatus } from '@/features/escrow/types'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_CFG: Record<EscrowApplicationStatus, { label: string; color: string; icon: typeof Clock }> = {
  '결제대기': { label: '결제 대기', color: 'text-yellow-600 bg-yellow-100',   icon: Clock },
  '결제완료': { label: '결제 완료', color: 'text-blue-600 bg-blue-100',       icon: CheckCircle },
  '진행중':   { label: '진행 중',   color: 'text-orange-600 bg-orange-100',   icon: Truck },
  '완료':     { label: '완료',      color: 'text-emerald-600 bg-emerald-100', icon: CheckCircle },
  '취소':     { label: '취소',      color: 'text-red-600 bg-red-100',         icon: XCircle },
}

export default function EscrowListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyEscrowApplications({ size: 50 })
  const items: EscrowApplication[] = data?.content ?? []

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
          {items.map((app) => {
            const cfg = STATUS_CFG[app.status]
            const StatusIcon = cfg.icon
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
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full', cfg.color)}>
                        <StatusIcon size={11} />
                        {cfg.label}
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
