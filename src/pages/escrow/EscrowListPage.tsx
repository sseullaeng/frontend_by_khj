// 에스크로 목록 페이지 — 백엔드 미지원 (배달대행 도메인은 /delivery 사용)
// TODO: 백엔드 합의 후 endpoint 연동
import { Link } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import type { EscrowApplication, EscrowStatus } from '@/features/escrow/types'
import { formatKst } from '@/shared/lib/date'

const applications: EscrowApplication[] = []

const statusConfig: Record<EscrowStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:     { label: '신청 중',      color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  confirmed:   { label: '확인 완료',    color: 'text-blue-600 bg-blue-100',     icon: CheckCircle },
  in_progress: { label: '대행 진행 중', color: 'text-orange-600 bg-orange-100', icon: Clock },
  completed:   { label: '완료',         color: 'text-green-600 bg-green-100',   icon: CheckCircle },
  cancelled:   { label: '취소',         color: 'text-red-600 bg-red-100',       icon: XCircle },
}

export default function EscrowListPage() {
  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">신청 목록</h1>
        <span className="text-sm text-gray-500">총 {applications.length}건</span>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Shield size={48} className="mb-4 opacity-40" />
          <p className="text-sm">신청한 대행 서비스가 없습니다.</p>
          <p className="text-xs mt-1">대행 신청을 먼저 진행해 주세요.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {applications.map((application) => {
            const cfg = statusConfig[application.status]
            const StatusIcon = cfg.icon
            return (
              <li key={application.id}>
                <Link
                  to={`/escrow/list/${application.id}`}
                  className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {application.itemInfo?.imageUrl ? (
                      <img
                        src={application.itemInfo.imageUrl}
                        alt={application.itemInfo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield size={24} className="text-gray-400 m-auto mt-7" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.color}`}>
                        <StatusIcon size={11} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">{application.id}</span>
                    </div>

                    {application.itemInfo && (
                      <p className="font-medium text-gray-900 truncate mb-1">
                        {application.itemInfo.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{application.role === 'buyer' ? '구매자' : '판매자'}</span>
                      {application.itemInfo && (
                        <span className="font-medium text-gray-900">
                          {application.itemInfo.price.toLocaleString()}원
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      신청일: {formatKst(application.createdAt, 'yyyy.MM.dd')}
                    </p>
                  </div>

                  <ArrowRight className="text-gray-400 mt-1 shrink-0" size={18} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
