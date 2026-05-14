// 배달대행 메인 — 등록 + 모집중 목록 + 내 배달 (가이드 §10.13)
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Truck, MapPin, Clock, Plus, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateDelivery,
  useDeliveryList,
  useMyDeliveries,
} from '@/features/delivery/hooks'
import type {
  Delivery,
  DeliveryCreateRequest,
  DeliveryStatus,
} from '@/features/delivery/types'
import { useAuthStore } from '@/features/auth/store'
import { useEmailGuard } from '@/features/auth/emailGuard'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { fromNow, formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_BADGE: Record<DeliveryStatus, string> = {
  '모집중':   'bg-blue-100 text-blue-700',
  '수락':     'bg-yellow-100 text-yellow-700',
  '배송중':   'bg-purple-100 text-purple-700',
  '배송완료': 'bg-emerald-100 text-emerald-700',
  '정산완료': 'bg-gray-100 text-gray-600',
  '취소':     'bg-red-100 text-red-600',
}

type Tab = 'OPEN' | 'MINE'

export default function DeliveryPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('OPEN')
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">배달대행</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={14} /> 요청 등록
        </button>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab('OPEN')}
            className={cn(
              'py-2 px-1 border-b-2 text-sm font-medium transition-colors',
              tab === 'OPEN'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            모집중
          </button>
          <button
            onClick={() => setTab('MINE')}
            className={cn(
              'py-2 px-1 border-b-2 text-sm font-medium transition-colors',
              tab === 'MINE'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            내 배달
          </button>
        </nav>
      </div>

      {tab === 'OPEN' ? <OpenList /> : <MyList />}

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function OpenList() {
  const { data, isLoading } = useDeliveryList()
  const items = data?.content ?? []
  if (isLoading) return <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
  if (items.length === 0)
    return (
      <div className="py-16 text-center">
        <Truck size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">모집중인 배달이 없어요.</p>
      </div>
    )
  return (
    <ul className="space-y-3">
      {items.map((d) => (
        <DeliveryRow key={d.id} delivery={d} />
      ))}
    </ul>
  )
}

function MyList() {
  const { data, isLoading } = useMyDeliveries()
  const items = data?.content ?? []
  if (isLoading) return <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
  if (items.length === 0)
    return (
      <div className="py-16 text-center">
        <Truck size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">참여 중인 배달이 없어요.</p>
      </div>
    )
  return (
    <ul className="space-y-3">
      {items.map((d) => (
        <DeliveryRow key={d.id} delivery={d} />
      ))}
    </ul>
  )
}

function DeliveryRow({ delivery }: { delivery: Delivery }) {
  const currentUser = useAuthStore((s) => s.user)
  const role =
    currentUser?.id === delivery.requesterId
      ? '요청자'
      : currentUser?.id === delivery.riderId
        ? '라이더'
        : null

  return (
    <Link
      to={`/delivery/${delivery.id}/track`}
      className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', STATUS_BADGE[delivery.status])}>
          {delivery.status}
        </span>
        {role && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {role}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">{fromNow(delivery.requestedAt)}</span>
      </div>

      <p className="font-medium text-gray-900 mb-1 text-sm truncate">{delivery.itemDescription}</p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
        <MapPin size={11} />
        <span className="truncate">{delivery.pickupAddress} → {delivery.dropoffAddress}</span>
      </div>

      {delivery.requestedDeadline && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          마감 {formatKst(delivery.requestedDeadline, 'M.d HH:mm')}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>요청자 {delivery.requesterNickname ?? `#${delivery.requesterId}`}</span>
        {delivery.riderId != null && (
          <span>라이더 {delivery.riderNickname ?? `#${delivery.riderId}`}</span>
        )}
      </div>

      <p className="mt-2 text-sm font-semibold text-primary-600">{delivery.fee.toLocaleString()}원</p>
    </Link>
  )
}

// ── 등록 모달 ───────────────────────────────────────────
function CreateModal({ onClose }: { onClose: () => void }) {
  const { isVerified } = useEmailGuard()
  const { mutateAsync, isPending } = useCreateDelivery()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<DeliveryCreateRequest>({
    defaultValues: { fee: 5000 },
  })

  const onSubmit = async (data: DeliveryCreateRequest) => {
    if (!isVerified) {
      toast.error('이메일 인증 후 요청할 수 있어요.')
      return
    }
    if (data.fee <= 0) {
      toast.error('수수료는 0원보다 커야 해요.')
      return
    }
    try {
      // datetime-local 보정 — "yyyy-MM-ddTHH:mm" → "yyyy-MM-ddTHH:mm:00"
      if (data.requestedDeadline && data.requestedDeadline.length === 16) {
        data.requestedDeadline = `${data.requestedDeadline}:00`
      }
      const created = await mutateAsync(data)
      onClose()
      navigate(`/delivery/${created.id}/track`)
    } catch {
      // hook 에서 토스트
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-4">배달 요청 등록</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            label="픽업 주소"
            placeholder="예: 서울 강남구 테헤란로 123"
            error={errors.pickupAddress?.message}
            {...register('pickupAddress', { required: '픽업 주소를 입력해 주세요.', maxLength: 255 })}
          />
          <Input
            label="배달 주소"
            placeholder="예: 서울 송파구 올림픽로 456"
            error={errors.dropoffAddress?.message}
            {...register('dropoffAddress', { required: '배달 주소를 입력해 주세요.', maxLength: 255 })}
          />
          <Input
            label="물품 설명"
            placeholder="예: A4 서류 봉투 1개"
            error={errors.itemDescription?.message}
            {...register('itemDescription', { required: '물품 설명을 입력해 주세요.', maxLength: 255 })}
          />
          <Input
            label="배달비 (원)"
            type="number"
            error={errors.fee?.message}
            {...register('fee', { valueAsNumber: true, required: true, min: 1 })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">희망 마감 시간 (선택)</label>
            <input
              type="datetime-local"
              {...register('requestedDeadline')}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">메모 (선택)</label>
            <textarea
              {...register('memo', { maxLength: 500 })}
              className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
              placeholder="픽업/전달 시 참고사항"
            />
          </div>

          <p className="text-xs text-gray-400">
            등록 시 잔액 차감은 없어요. 정산(완료) 시점에 잔액에서 수수료가 라이더에게 이동됩니다.
          </p>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
            >
              취소
            </button>
            <Button type="submit" isLoading={isPending} className="flex-1">
              등록
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
