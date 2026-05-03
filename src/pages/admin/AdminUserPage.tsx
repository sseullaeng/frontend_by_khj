// 관리자 회원 관리 — 가이드 §11.2
import { useState } from 'react'
import { useAdminUsers, useSetUserBlocked } from '@/features/admin/hooks'
import { formatKst } from '@/shared/lib/date'
import { cn } from '@/shared/lib/cn'

export default function AdminUserPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminUsers({ page, size: 20 })
  const { mutate: setBlocked, isPending } = useSetUserBlocked()
  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">회원 관리</h1>

      {isLoading ? (
        <p className="py-12 text-center text-gray-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-400">회원이 없어요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs">
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-left py-2 px-2">이메일</th>
                <th className="text-left py-2 px-2">닉네임</th>
                <th className="text-left py-2 px-2">제공자</th>
                <th className="text-right py-2 px-2">잔액</th>
                <th className="text-right py-2 px-2">신뢰</th>
                <th className="text-center py-2 px-2">상태</th>
                <th className="text-left py-2 px-2">가입일</th>
                <th className="text-center py-2 px-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-500">#{u.id}</td>
                  <td className="py-2 px-2">{u.email}</td>
                  <td className="py-2 px-2 font-medium">{u.nickname}</td>
                  <td className="py-2 px-2 text-xs text-gray-500">{u.socialProvider}</td>
                  <td className="py-2 px-2 text-right">{u.pointBalance.toLocaleString()}원</td>
                  <td className="py-2 px-2 text-right">
                    {u.trustScore != null ? u.trustScore.toFixed(1) : '신규'}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {u.deleted ? (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">탈퇴</span>
                    ) : u.blocked ? (
                      <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">차단</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">활성</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-500">{formatKst(u.createdAt, 'yyyy.MM.dd')}</td>
                  <td className="py-2 px-2 text-center">
                    {!u.deleted && (
                      <button
                        onClick={() => setBlocked({ id: u.id, blocked: !u.blocked })}
                        disabled={isPending}
                        className={cn(
                          'px-2 py-1 text-xs rounded border transition-colors disabled:opacity-50',
                          u.blocked
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'border-amber-300 text-amber-700 hover:bg-amber-50',
                        )}
                      >
                        {u.blocked ? '차단 해제' : '차단'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
