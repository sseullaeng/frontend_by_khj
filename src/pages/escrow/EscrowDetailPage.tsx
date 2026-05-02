// 에스크로 상세 페이지 컴포넌트: 에스크로 신청 상세 정보 표시 및 관리
import { useParams, Link } from 'react-router-dom'  // React Router 훅 및 컴포넌트
import { useState } from 'react'  // React 상태 훅
import { ArrowLeft, Receipt, MapPin, Clock, Package } from 'lucide-react'  // Lucide 아이콘들
import type { EscrowApplication, EscrowStatus } from '@/features/escrow/types'  // 에스크로 관련 타입
import { formatKst } from '@/shared/lib/date'

// 모의 에스크로 신청 데이터: 개발용 샘플 데이터
const mockApplication: EscrowApplication = {
  id: 'ESC-001',  // 에스크로 신청 ID
  role: 'buyer',  // 사용자 역할 (구매자)
  feePayer: 'buyer',  // 수수료 부담자 (구매자)
  itemInfo: {
    id: 1,  // 물품 ID
    title: '맥북 프로 14인치 2023',  // 물품 제목
    imageUrl: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Item',  // 물품 이미지
    price: 1_800_000,  // 물품 가격
  },
  deliveryInfo: {
    address: '서울 강남구 테헤란로 123',  // 배달 주소
    lat: 37.5665,  // 위도
    lng: 126.9780,  // 경도
  },
  status: 'in_progress',  // 진행 상태
  linkId: 'LINK-001',  // 연결 ID
  createdAt: '2026-04-28T10:00:00Z',  // 생성 시간
  updatedAt: '2026-04-28T10:00:00Z',  // 업데이트 시간
}

// 에스크로 상태 라벨 맵핑: 상태별 한글 라벨
const STATUS_LABEL: Record<EscrowStatus, string> = {
  pending:     '신청 중',      // 신청 대기 상태
  confirmed:   '확인 완료',    // 확인 완료 상태
  in_progress: '대행 진행 중',  // 대행 진행 상태
  completed:   '완료',
  cancelled:   '취소',
}

const STATUS_COLOR: Record<EscrowStatus, string> = {
  pending:     'text-yellow-600 bg-yellow-100',
  confirmed:   'text-blue-600 bg-blue-100',
  in_progress: 'text-orange-600 bg-orange-100',
  completed:   'text-green-600 bg-green-100',
  cancelled:   'text-red-600 bg-red-100',
}

const FEE_RATE = 0.05

export default function EscrowDetailPage() {
  useParams<{ id: string }>()
  const [application] = useState<EscrowApplication>(mockApplication)

  const itemPrice = application.itemInfo?.price ?? 0
  const fee = Math.floor(itemPrice * FEE_RATE)
  const total = itemPrice + fee

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      <Link
        to="/escrow/list"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors text-sm"
      >
        <ArrowLeft size={18} />
        신청 목록으로
      </Link>

      {/* 상태 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 font-mono">#{application.id}</p>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLOR[application.status]}`}>
            {STATUS_LABEL[application.status]}
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">내 역할</span>
            <span className="ml-2 font-medium text-gray-900">
              {application.role === 'buyer' ? '구매자' : '판매자'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">수수료 부담</span>
            <span className="ml-2 font-medium text-gray-900">
              {application.feePayer === 'buyer' ? '구매자' :
               application.feePayer === 'seller' ? '판매자' : '반반'}
            </span>
          </div>
        </div>
      </div>

      {/* 물품 정보 — 클릭 시 물품 상세페이지로 이동 */}
      {application.itemInfo && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-primary-600" />
            대행 물품
          </h2>
          <Link to={`/items/${application.itemInfo.id}`} className="block group">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
              <img
                src={application.itemInfo.imageUrl}
                alt={application.itemInfo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
              {application.itemInfo.title}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {itemPrice.toLocaleString()}원
            </p>
          </Link>
        </div>
      )}

      {/* 영수증 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-primary-600" />
          대행 영수증
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">물품 금액</span>
            <span className="text-gray-900">{itemPrice.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">대행 수수료 (5%)</span>
            <span className="text-gray-900">{fee.toLocaleString()}원</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-semibold">
            <span className="text-gray-900">합계</span>
            <span className="text-primary-600 text-base">{total.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 배달지 */}
      {application.deliveryInfo && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-primary-600" />
            배달지
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 font-medium">{application.deliveryInfo.address}</p>
          </div>
        </div>
      )}

      {/* 타임라인 */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock size={18} className="text-gray-500" />
          처리 내역
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">신청일</span>
            <span className="text-gray-900">
              {formatKst(application.createdAt, 'yyyy.MM.dd HH:mm')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">최근 업데이트</span>
            <span className="text-gray-900">
              {formatKst(application.updatedAt, 'yyyy.MM.dd HH:mm')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
