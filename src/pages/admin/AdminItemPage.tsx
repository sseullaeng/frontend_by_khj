// 관리자 물품 관리 — 라운드13 PR #134
//
// Endpoints:
//   GET    /api/v1/admin/items?q=&status=&tradeType=&sort=
//   GET    /api/v1/admin/items/{id}     — admin 전용 상세 (신고/거래 이력)
//   DELETE /api/v1/admin/items/{id}     — 강제 삭제 (PR #54)
import { useState } from 'react'
import {
  Package,
  Search,
  Eye,
  Heart,
  AlertTriangle,
  Trash2,
  Hash,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminKeys, useAdminItems, useAdminItemDetail } from '@/features/admin/hooks'
import { useAdminDeleteItem } from '@/features/item/hooks'
import type { AdminItemSummary, AdminItemsListParams } from '@/features/admin/types'
import type { ItemStatus, TradeType } from '@/features/item/types'
import { Button } from '@/shared/ui/Button'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'
import { formatKst, fromNow } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

const STATUS_OPTIONS: { value: ItemStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '상태 전체' },
  { value: '판매중', label: '판매중' },
  { value: '예약', label: '예약' },
  { value: '거래완료', label: '거래완료' },
  { value: '비공개', label: '비공개' },
  { value: '삭제', label: '삭제' },
]

const TRADE_TYPE_OPTIONS: { value: TradeType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '거래 전체' },
  { value: '판매', label: '판매' },
  { value: '대여', label: '대여' },
  { value: '나눔', label: '나눔' },
]

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'view_desc', label: '조회 많은 순' },
  { value: 'report_desc', label: '신고 많은 순' },
] as const

export default function AdminItemPage() {
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ItemStatus | 'ALL'>('ALL')
  const [tradeType, setTradeType] = useState<TradeType | 'ALL'>('ALL')
  const [categoryId, setCategoryId] = useState('')
  const [createdAfter, setCreatedAfter] = useState('')
  const [createdBefore, setCreatedBefore] = useState('')
  const [sort, setSort] = useState<AdminItemsListParams['sort']>('latest')
  const [page, setPage] = useState(0)

  const params: AdminItemsListParams = {
    q: q || undefined,
    status: status === 'ALL' ? undefined : status,
    tradeType: tradeType === 'ALL' ? undefined : tradeType,
    categoryId: categoryId.trim() ? Number(categoryId) : undefined,
    createdAfter: createdAfter ? `${createdAfter}T00:00:00` : undefined,
    createdBefore: createdBefore ? `${createdBefore}T23:59:59` : undefined,
    sort,
    page,
    size: 20,
  }
  const { data, isLoading } = useAdminItems(params)
  const [detailId, setDetailId] = useState<number | null>(null)

  const handleSearch = () => {
    setQ(qInput.trim())
    setPage(0)
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Package size={20} className="text-primary-500" />
        <h1 className="text-xl font-bold text-gray-900">물품 관리</h1>
      </div>

      {/* 필터 바 */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              placeholder="제목 또는 판매자 닉네임 검색"
              className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg"
          >
            검색
          </button>
        </div>
        <div className="flex gap-2 flex-wrap text-xs">
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v as ItemStatus | 'ALL')
              setPage(0)
            }}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            value={tradeType}
            onChange={(v) => {
              setTradeType(v as TradeType | 'ALL')
              setPage(0)
            }}
            options={TRADE_TYPE_OPTIONS}
          />
          <FilterSelect
            value={sort ?? 'latest'}
            onChange={(v) => {
              setSort(v as AdminItemsListParams['sort'])
              setPage(0)
            }}
            options={SORT_OPTIONS}
          />
          <input
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value.replace(/[^0-9]/g, ''))
              setPage(0)
            }}
            placeholder="카테고리 ID"
            inputMode="numeric"
            className="h-8 w-28 px-2 border border-gray-300 rounded-md bg-white text-gray-700"
          />
          <input
            type="date"
            value={createdAfter}
            max={createdBefore || undefined}
            onChange={(e) => {
              setCreatedAfter(e.target.value)
              setPage(0)
            }}
            className="h-8 px-2 border border-gray-300 rounded-md bg-white text-gray-700"
            aria-label="생성일 시작"
          />
          <input
            type="date"
            value={createdBefore}
            min={createdAfter || undefined}
            onChange={(e) => {
              setCreatedBefore(e.target.value)
              setPage(0)
            }}
            className="h-8 px-2 border border-gray-300 rounded-md bg-white text-gray-700"
            aria-label="생성일 종료"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (data?.content.length ?? 0) === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">결과가 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data!.content.map((it) => (
            <ItemRow key={it.id} item={it} onOpenDetail={() => setDetailId(it.id)} />
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm text-gray-600">
          <button
            disabled={!data.hasPrevious}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5">
            {data.page + 1} / {data.totalPages}
          </span>
          <button
            disabled={!data.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {detailId != null && <AdminItemDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <SelectDropdown
      value={value}
      onChange={onChange}
      options={options}
      buttonClassName="h-8 min-w-28 rounded-lg px-2.5 text-xs shadow-none"
      menuClassName="left-0 right-auto"
    />
  )
}

function ItemRow({ item, onOpenDetail }: { item: AdminItemSummary; onOpenDetail: () => void }) {
  return (
    <li className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-50">
      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
          <span className="text-[10px] text-gray-400 inline-flex items-center gap-0.5">
            <Hash size={10} />
            {item.id}
          </span>
          {!(item.rentalActive && item.status === '예약') && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                item.status === '판매중'
                  ? 'bg-green-100 text-green-700'
                  : item.status === '예약'
                    ? 'bg-yellow-100 text-yellow-700'
                    : item.status === '거래완료'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-100 text-red-700'
              )}
            >
              {item.status}
            </span>
          )}
          {item.rentalActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-600 text-white">
              대여중
            </span>
          )}
          {item.tradeTypes?.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-0.5 truncate">
          판매자{' '}
          <Link to={`/users/${item.sellerId}`} className="text-primary-600 hover:underline">
            {item.sellerNickname} #{item.sellerId}
          </Link>
          {' · '}
          {item.salePrice != null && `판매 ${item.salePrice.toLocaleString()}원 `}
          {item.rentalPrice != null && `대여 ${item.rentalPrice.toLocaleString()}원 `}
          {item.salePrice == null && item.rentalPrice == null && '무료 나눔'}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
          <span className="inline-flex items-center gap-0.5">
            <Eye size={11} /> {item.viewCount}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Heart size={11} /> {item.wishlistCount}
          </span>
          {item.reportCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-red-500 font-medium">
              <AlertTriangle size={11} /> 신고 {item.reportCount}
            </span>
          )}
          <span>{fromNow(item.createdAt)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button size="sm" variant="outline" onClick={onOpenDetail}>
          상세
        </Button>
        <Link
          to={`/items/${item.id}`}
          className="inline-flex items-center justify-center gap-1 px-3 h-8 text-xs text-gray-500 hover:text-gray-700"
        >
          <ExternalLink size={11} /> 일반
        </Link>
      </div>
    </li>
  )
}

// ─── Admin 전용 상세 모달 ──────────────────────────────────────────────────

function AdminItemDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminItemDetail(id)
  const { mutate: deleteByAdmin, isPending: isDeleting } = useAdminDeleteItem()
  const [confirmDel, setConfirmDel] = useState(false)

  const handleDelete = () => {
    deleteByAdmin(id, {
      onSuccess: () => {
        toast.success('삭제됐어요.')
        qc.invalidateQueries({ queryKey: adminKeys.all() })
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-xl">
        {isLoading || !data ? (
          <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">{data.item.title}</h3>
                <p className="text-xs text-gray-500">
                  #{data.item.id} · 판매자 {data.sellerNickname} (#{data.item.sellerId})
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 px-2 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
              <Stat label="상태" value={data.item.status} />
              <Stat label="조회" value={`${data.item.viewCount}`} />
              <Stat label="찜" value={`${data.item.wishlistCount}`} />
              <Stat label="신고" value={`${data.reportCount}`} highlight={data.reportCount > 0} />
            </div>

            <p className="text-xs text-gray-600 whitespace-pre-wrap mb-3 line-clamp-6">
              {data.item.description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Link
                to={`/items/${data.item.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <ExternalLink size={11} /> 일반 페이지에서 열기
              </Link>
            </div>

            <section className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                신고 이력 ({data.reportHistory.length})
              </p>
              {data.reportHistory.length === 0 ? (
                <p className="text-xs text-gray-400">신고 없음</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.reportHistory.map((r) => (
                    <li
                      key={r.id}
                      className="text-xs text-gray-700 border border-gray-100 rounded-lg px-2.5 py-1.5"
                    >
                      <span className="text-red-500 mr-1">●</span>
                      {r.reason} · {r.status} · 신고자{' '}
                      <Link
                        to={`/users/${r.reporterId}`}
                        className="text-primary-600 hover:underline"
                      >
                        #{r.reporterId}
                      </Link>
                      {' · '}
                      {fromNow(r.createdAt)}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                거래 이력 ({data.transactionHistory.length})
              </p>
              {data.transactionHistory.length === 0 ? (
                <p className="text-xs text-gray-400">거래 없음</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.transactionHistory.map((t) => (
                    <li
                      key={t.id}
                      className="text-xs text-gray-700 border border-gray-100 rounded-lg px-2.5 py-1.5 flex justify-between gap-2"
                    >
                      <span className="truncate">
                        #{t.id} · 구매자{' '}
                        <Link
                          to={`/users/${t.buyerId}`}
                          className="text-primary-600 hover:underline"
                        >
                          {t.buyerNickname}
                        </Link>
                        {' · '}
                        {t.status} · {t.price.toLocaleString()}원
                      </span>
                      {t.completedAt && (
                        <span className="text-gray-400 shrink-0">
                          {formatKst(t.completedAt, 'M.d HH:mm')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                닫기
              </button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => setConfirmDel(true)}
                disabled={isDeleting}
              >
                <Trash2 size={14} className="mr-1" /> 강제 삭제
              </Button>
            </div>

            {confirmDel && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl px-4">
                <div className="bg-white rounded-xl p-5 max-w-xs w-full shadow-xl">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">정말 삭제할까요?</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    관리자 권한으로 강제 삭제됩니다. 복구 불가.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDel(false)}
                      disabled={isDeleting}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 disabled:opacity-50"
                    >
                      취소
                    </button>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleDelete}
                      isLoading={isDeleting}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg px-2.5 py-1.5 border',
        highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
      )}
    >
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={cn('text-sm font-bold', highlight ? 'text-red-600' : 'text-gray-900')}>
        {value}
      </p>
    </div>
  )
}
