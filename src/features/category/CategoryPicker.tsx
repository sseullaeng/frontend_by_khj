// 카테고리 선택 컴포넌트 — 2단 깊이 (1차 → 2차) + 키워드 검색
//
// 사용:
//   <CategoryPicker value={categoryId} onChange={setCategoryId} />
//
// 검색 동작:
//   - 검색어 비어있음 → 기존 2단 트리 (1차 hover → 2차)
//   - 검색어 있음     → 매칭되는 카테고리 flat list (잎만 선택 가능)

import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { useCategoryLookup } from './hooks'
import { cn } from '@/shared/lib/cn'

interface Props {
  value: number | null | undefined
  onChange: (id: number) => void
  disabled?: boolean
}

export default function CategoryPicker({ value, onChange, disabled }: Props) {
  const { tree, getLabel, isLoading } = useCategoryLookup()
  const [open, setOpen] = useState(false)
  const [hoveredRootId, setHoveredRootId] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  const label = useMemo(() => getLabel(value), [value, getLabel])

  const hoveredRoot = useMemo(
    () => tree?.find((r) => r.id === hoveredRootId) ?? tree?.[0],
    [tree, hoveredRootId],
  )

  // 검색 결과 — 트리 flat → 매칭되는 항목만 (root 포함, child 우선)
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !tree) return null
    const matches: { id: number; label: string; isLeaf: boolean }[] = []
    for (const root of tree) {
      const rootMatch = root.name.toLowerCase().includes(q)
      if (root.children.length === 0) {
        if (rootMatch) matches.push({ id: root.id, label: root.name, isLeaf: true })
      } else {
        for (const child of root.children) {
          if (rootMatch || child.name.toLowerCase().includes(q)) {
            matches.push({ id: child.id, label: `${root.name} > ${child.name}`, isLeaf: true })
          }
        }
      }
    }
    return matches
  }, [query, tree])

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-400 text-left bg-gray-50"
      >
        카테고리 불러오는 중...
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-left flex items-center justify-between transition-colors',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          !label && 'text-gray-400',
        )}
      >
        <span className="truncate">{label || '카테고리 선택'}</span>
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && tree && (
        <>
          {/* 외부 클릭 닫기용 backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => { setOpen(false); setQuery('') }} />

          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {/* 검색 입력 */}
            <div className="relative border-b border-gray-100 bg-gray-50">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                placeholder="카테고리 검색"
                className="w-full pl-8 pr-8 py-2 text-sm bg-transparent outline-none"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 지우기"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* 검색 결과 모드 */}
            {searchResults != null ? (
              <ul className="max-h-72 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-gray-400">검색 결과가 없어요.</li>
                ) : (
                  searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => { onChange(r.id); setOpen(false); setQuery('') }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                          value === r.id && 'bg-primary-50 text-primary-600 font-medium',
                        )}
                      >
                        {r.label}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              /* 트리 모드 (검색어 없음) */
              <div className="flex">
                <ul className="w-1/2 max-h-72 overflow-y-auto border-r border-gray-100">
                  {tree.map((root) => (
                    <li key={root.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredRootId(root.id)}
                        onClick={() => {
                          if (root.children.length === 0) {
                            onChange(root.id)
                            setOpen(false)
                          } else {
                            setHoveredRootId(root.id)
                          }
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                          hoveredRoot?.id === root.id && 'bg-gray-50 font-medium',
                        )}
                      >
                        {root.name}
                        {root.children.length > 0 && (
                          <span className="float-right text-gray-400">›</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                <ul className="w-1/2 max-h-72 overflow-y-auto">
                  {hoveredRoot?.children.length ? (
                    hoveredRoot.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => { onChange(child.id); setOpen(false) }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                            value === child.id && 'bg-primary-50 text-primary-600 font-medium',
                          )}
                        >
                          {child.name}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-xs text-gray-400">하위 카테고리 없음</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
