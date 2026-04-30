import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import type { EscrowApplication, EscrowStatus } from '@/features/escrow/types'

const mockApplications: EscrowApplication[] = [
  {
    id: 'ESC-001',
    role: 'buyer',
    feePayer: 'buyer',
    itemInfo: {
      id: 1,
      title: '맥북 프로 14인치 2023',
      imageUrl: 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Item',
      price: 1_800_000,
    },
    deliveryInfo: { address: '서울 강남구 테헤란로', lat: 37.5665, lng: 126.9780 },
    status: 'in_progress',
    linkId: 'LINK-001',
    createdAt: '2026-04-28T10:00:00Z',
    updatedAt: '2026-04-28T10:00:00Z',
  },
  {
    id: 'ESC-002',
    role: 'seller',
    feePayer: 'both',
    itemInfo: {
      id: 2,
      title: '아이패드 에어 5세대',
      imageUrl: 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Item',
      price: 650_000,
    },
    deliveryInfo: { address: '서울 서초구 반포대로', lat: 37.5172, lng: 127.0473 },
    status: 'pending',
    linkId: 'LINK-002',
    createdAt: '2026-04-30T15:30:00Z',
    updatedAt: '2026-04-30T15:30:00Z',
  },
  {
    id: 'ESC-003',
    role: 'buyer',
    feePayer: 'seller',
    itemInfo: {
      id: 3,
      title: '소니 WH-1000XM5 헤드폰',
      imageUrl: 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Item',
      price: 280_000,
    },
    deliveryInfo: { address: '경기 성남시 분당구', lat: 37.4837, lng: 127.0324 },
    status: 'completed',
    linkId: 'LINK-003',
    createdAt: '2026-04-25T12:00:00Z',
    updatedAt: '2026-04-27T18:45:00Z',
  },
]

const statusConfig: Record<EscrowStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:     { label: '신청 중',      color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  confirmed:   { label: '확인 완료',    color: 'text-blue-600 bg-blue-100',     icon: CheckCircle },
  in_progress: { label: '대행 진행 중', color: 'text-orange-600 bg-orange-100', icon: Clock },
  completed:   { label: '완료',         color: 'text-green-600 bg-green-100',   icon: CheckCircle },
  cancelled:   { label: '취소',         color: 'text-red-600 bg-red-100',       icon: XCircle },
}

export default function EscrowListPage() {
  const [applications] = useState<EscrowApplication[]>(mockApplications)

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
                      신청일: {new Date(application.createdAt).toLocaleDateString('ko-KR')}
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
