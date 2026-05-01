import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ChevronLeft, Trash2, User, Shield, Handshake } from 'lucide-react'
import { useMyItems, useDeleteItem } from '@/features/item/hooks'
import { fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'
import type { Item, ItemStatus } from '@/features/item/types'

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string }> = {
  ACTIVE:   { label: '판매중',   color: 'text-green-600 bg-green-100' },
  RESERVED: { label: '예약중',   color: 'text-yellow-600 bg-yellow-100' },
  SOLD:     { label: '판매완료', color: 'text-gray-500 bg-gray-100' },
  HIDDEN:   { label: '숨김',     color: 'text-red-600 bg-red-100' },
}

const TYPE_LABEL: Record<string, string> = {
  SELL: '중고거래', RENT: '대여', SHARE: '나눔',
}
const TYPE_COLOR: Record<string, string> = {
  SELL: 'bg-blue-100 text-blue-700',
  RENT: 'bg-green-100 text-green-700',
  SHARE: 'bg-purple-100 text-purple-700',
}

export default function MyItemsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyItems()
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem()
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const items = data?.content ?? []

  const handleDelete = (id: number) => {
    deleteItem(id, { onSuccess: () => setConfirmId(null) })
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">내 거래</h1>
        <span className="text-sm text-gray-400 ml-auto">총 {items.length}건</span>
      </div>

      {isLoading && (
        <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ShoppingBag size={48} className="mb-4 opacity-30" />
          <p className="text-sm">완료된 거래가 없어요</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onView={() => navigate(`/items/${item.id}`)}
              onDelete={() => setConfirmId(item.id)}
            />
          ))}
        </ul>
      )}

      {/* 삭제 확인 모달 */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">거래 내역을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제된 내역은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  onView,
  onDelete,
}: {
  item: Item
  onView: () => void
  onDelete: () => void
}) {
  const status = STATUS_CONFIG[item.status]

  return (
    <li className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl">
      {/* 이미지 — 클릭 시 상품 상세 */}
      <button onClick={onView} className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 hover:opacity-90 transition-opacity">
        {item.imageUrls[0] ? (
          <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={20} className="text-gray-300" />
          </div>
        )}
      </button>

      {/* 내용 */}
      <button onClick={onView} className="flex-1 min-w-0 text-left">
        {/* 배지 */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', status.color)}>
            {status.label}
          </span>
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', TYPE_COLOR[item.itemType])}>
            {TYPE_LABEL[item.itemType]}
          </span>
          <span className={cn(
            'flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full',
            item.isEscrow
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-500'
          )}>
            {item.isEscrow
              ? <><Shield size={10} /> 거래대행</>
              : <><Handshake size={10} /> 직접거래</>
            }
          </span>
        </div>

        {/* 제목 */}
        <p className="font-medium text-gray-900 truncate text-sm mb-1">{item.title}</p>

        {/* 가격 */}
        <p className="text-sm font-semibold text-gray-900 mb-1.5">
          {item.itemType === 'SHARE' ? '무료 나눔' : `${item.price.toLocaleString()}원`}
        </p>

        {/* 거래자 + 날짜 */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {item.buyerNickname && (
            <span className="flex items-center gap-1">
              <User size={11} />
              <span className="text-gray-600 font-medium">{item.buyerNickname}</span>
            </span>
          )}
          <span>{fromNow(item.createdAt)}</span>
        </div>
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        aria-label="삭제"
      >
        <Trash2 size={17} />
      </button>
    </li>
  )
}
