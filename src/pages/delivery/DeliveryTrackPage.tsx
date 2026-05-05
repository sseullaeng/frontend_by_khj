// 배달 단건 + 액션 (가이드 §10.13 + 라운드6 실시간 위치)
//
// - 폴링 5초 (status 변화 추적)
// - 추적 가능 상태(수락/배송중)에서 실시간 위치:
//   * 라이더 → STOMP publish (5초 주기)
//   * 양쪽   → STOMP subscribe + REST fallback (마지막 좌표)

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, MapPin, Clock, Truck, Hash, MessageSquare, Navigation } from 'lucide-react'
import {
  useAcceptDelivery,
  useCancelDelivery,
  useCompleteDelivery,
  useDeliverDelivery,
  useDeliveryDetail,
  usePickupDelivery,
} from '@/features/delivery/hooks'
import {
  useDeliveryLocation,
  useRiderLocationPublisher,
} from '@/features/delivery/locationHooks'
import { useUserProfile } from '@/features/user/hooks'
import { useAuthStore } from '@/features/auth/store'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { fromNow, formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import KakaoMap from '@/shared/ui/KakaoMap'
import type { DeliveryStatus } from '@/features/delivery/types'

const STATUS_CFG: Record<DeliveryStatus, { color: string; step: number }> = {
  '모집중':   { color: 'text-blue-700 bg-blue-100',     step: 0 },
  '수락':     { color: 'text-yellow-700 bg-yellow-100', step: 1 },
  '배송중':   { color: 'text-purple-700 bg-purple-100', step: 2 },
  '배송완료': { color: 'text-emerald-700 bg-emerald-100', step: 3 },
  '정산완료': { color: 'text-gray-700 bg-gray-100',     step: 4 },
  '취소':     { color: 'text-red-700 bg-red-100',       step: -1 },
}

const STEPS: DeliveryStatus[] = ['모집중', '수락', '배송중', '배송완료', '정산완료']

export default function DeliveryTrackPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const deliveryId = Number(id)
  const currentUser = useAuthStore((s) => s.user)
  const { requireVerified } = useEmailGuard()

  // 폴링 — 좌표 미지원이라 상태 변화 추적용 (가이드 권장)
  const { data: delivery, isLoading } = useDeliveryDetail(deliveryId, { polling: true })

  const acceptM = useAcceptDelivery(deliveryId)
  const pickupM = usePickupDelivery(deliveryId)
  const deliverM = useDeliverDelivery(deliveryId)
  const completeM = useCompleteDelivery(deliveryId)
  const cancelM = useCancelDelivery(deliveryId)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const requesterProfile = useUserProfile(delivery?.requesterId ?? 0)
  const riderProfile = useUserProfile(delivery?.riderId ?? 0)

  if (isLoading) return <div className="py-20 text-center text-gray-500">불러오는 중...</div>
  if (!delivery) return <div className="py-20 text-center text-gray-500">배달 정보를 찾을 수 없어요.</div>

  const isRequester = currentUser?.id === delivery.requesterId
  const isRider = currentUser?.id === delivery.riderId
  const isOpen = delivery.status === '모집중'
  const cfg = STATUS_CFG[delivery.status]

  // 가능한 액션
  const canAccept   = !isRequester && isOpen
  const canPickup   = isRider && delivery.status === '수락'
  const canDeliver  = isRider && delivery.status === '배송중'
  const canComplete = isRequester && delivery.status === '배송완료'
  const canCancel   = isRequester && isOpen   // 모집중 한정

  // 실시간 위치 — 추적 가능 상태(수락/배송중) 에서만 활성화
  const isTrackable = delivery.status === '수락' || delivery.status === '배송중'
  // 라이더는 publish, 요청자/라이더 모두 subscribe
  useRiderLocationPublisher(deliveryId, isRider && isTrackable)
  const liveLocation = useDeliveryLocation(deliveryId, (isRequester || isRider) && isTrackable)

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">배달 추적</h1>
      </div>

      {/* 상태 + 진행 단계 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn('px-3 py-1 text-sm font-medium rounded-full', cfg.color)}>
            {delivery.status}
          </span>
          <span className="text-xs text-gray-400">{fromNow(delivery.requestedAt)}</span>
        </div>

        {delivery.status !== '취소' && (
          <div className="flex items-center gap-1 text-xs">
            {STEPS.map((s, i) => {
              const done = cfg.step >= i
              return (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div
                    className={cn(
                      'flex-1 h-1 rounded',
                      done ? 'bg-primary-500' : 'bg-gray-200',
                    )}
                  />
                  <span className={done ? 'text-gray-700' : 'text-gray-400'}>{s}</span>
                </div>
              )
            })}
          </div>
        )}

        {delivery.cancelReason && (
          <p className="mt-2 text-xs text-red-600">취소 사유: {delivery.cancelReason}</p>
        )}
      </div>

      {/* 물품 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">배달 정보</h2>
        <div className="space-y-2.5 text-sm">
          <Row icon={<Truck size={16} />} label="물품" value={delivery.itemDescription} />
          <Row icon={<MapPin size={16} />} label="픽업" value={delivery.pickupAddress} />
          <Row icon={<MapPin size={16} />} label="배달" value={delivery.dropoffAddress} />
          <Row icon={<Hash size={16} />} label="배달비" value={`${delivery.fee.toLocaleString()}원`} />
          {delivery.requestedDeadline && (
            <Row
              icon={<Clock size={16} />}
              label="마감"
              value={formatKst(delivery.requestedDeadline, 'yyyy.MM.dd HH:mm')}
            />
          )}
          {delivery.memo && (
            <Row icon={<MessageSquare size={16} />} label="메모" value={delivery.memo} />
          )}
        </div>
      </div>

      {/* 실시간 위치 — 수락/배송중 동안 노출 */}
      {isTrackable && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Navigation size={16} className="text-blue-500" />
            라이더 위치
            {isRider && (
              <span className="text-xs text-gray-400 font-normal">
                (5초 주기 자동 전송 중)
              </span>
            )}
          </h2>

          {liveLocation ? (
            <div className="space-y-3">
              {/* 카카오맵 — 라이더 마커 + center 자동 panTo */}
              <KakaoMap
                center={{ lat: liveLocation.latitude, lng: liveLocation.longitude }}
                marker={{ lat: liveLocation.latitude, lng: liveLocation.longitude, label: '라이더' }}
                height="280px"
              />

              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-14 shrink-0">좌표</span>
                  <a
                    href={`https://map.kakao.com/link/map/라이더,${liveLocation.latitude},${liveLocation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                  </a>
                </div>
                {liveLocation.accuracyM != null && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 w-14 shrink-0">정확도</span>
                    <span className="text-gray-700">±{Math.round(liveLocation.accuracyM)}m</span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-xs text-gray-400">
                  <span className="w-14 shrink-0">갱신</span>
                  <span>{fromNow(liveLocation.recordedAt)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              {isRider
                ? '위치 권한을 허용하면 자동으로 전송됩니다.'
                : '아직 라이더 위치 정보가 없어요.'}
            </p>
          )}
        </div>
      )}

      {/* 참여자 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-2 gap-3">
        <ParticipantCard
          label="요청자"
          userId={delivery.requesterId}
          profile={requesterProfile.data}
        />
        <ParticipantCard
          label="라이더"
          userId={delivery.riderId}
          profile={riderProfile.data}
        />
      </div>

      {/* 시각 메타 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>요청</span><span>{fromNow(delivery.requestedAt)}</span>
        </div>
        {delivery.acceptedAt && (
          <div className="flex justify-between"><span>수락</span><span>{fromNow(delivery.acceptedAt)}</span></div>
        )}
        {delivery.pickedUpAt && (
          <div className="flex justify-between"><span>픽업</span><span>{fromNow(delivery.pickedUpAt)}</span></div>
        )}
        {delivery.deliveredAt && (
          <div className="flex justify-between"><span>배송 완료</span><span>{fromNow(delivery.deliveredAt)}</span></div>
        )}
        {delivery.completedAt && (
          <div className="flex justify-between"><span>정산 완료</span><span>{fromNow(delivery.completedAt)}</span></div>
        )}
        {delivery.canceledAt && (
          <div className="flex justify-between"><span>취소</span><span>{fromNow(delivery.canceledAt)}</span></div>
        )}
      </div>

      {/* 액션 버튼 */}
      {(canAccept || canPickup || canDeliver || canComplete || canCancel) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
          {canCancel && (
            <Button variant="outline" fullWidth onClick={() => setCancelOpen(true)} isLoading={cancelM.isPending}>
              취소
            </Button>
          )}
          {canAccept && (
            <Button fullWidth onClick={() => requireVerified(() => acceptM.mutate())} isLoading={acceptM.isPending}>
              수락하기
            </Button>
          )}
          {canPickup && (
            <Button fullWidth onClick={() => pickupM.mutate()} isLoading={pickupM.isPending}>
              픽업 완료
            </Button>
          )}
          {canDeliver && (
            <Button fullWidth onClick={() => deliverM.mutate()} isLoading={deliverM.isPending}>
              배송 완료
            </Button>
          )}
          {canComplete && (
            <Button fullWidth onClick={() => completeM.mutate()} isLoading={completeM.isPending}>
              정산 완료
            </Button>
          )}
        </div>
      )}

      {/* 취소 모달 */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">배달 요청을 취소할까요?</h3>
            <p className="text-sm text-gray-500 mb-3">취소 사유를 입력해 주세요. (선택)</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              placeholder="예: 배송이 더 이상 필요 없어졌어요"
              className="w-full h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setCancelOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                돌아가기
              </button>
              <button
                onClick={() => {
                  cancelM.mutate(cancelReason ? { reason: cancelReason } : undefined)
                  setCancelOpen(false)
                }}
                disabled={cancelM.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <span className="text-gray-500 w-14 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 flex-1 break-words">{value}</span>
    </div>
  )
}

function ParticipantCard({
  label,
  userId,
  profile,
}: {
  label: string
  userId: number | null
  profile: { nickname: string; profileImage: string | null } | undefined
}) {
  return (
    <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      {userId ? (
        <Link to={`/users/${userId}`} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">#</div>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-full">
            {profile?.nickname ?? `사용자 #${userId}`}
          </p>
        </Link>
      ) : (
        <p className="text-xs text-gray-400 mt-2">아직 없음</p>
      )}
    </div>
  )
}
