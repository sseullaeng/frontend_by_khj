// 카테고리 선택 컴포넌트 — 2단 깊이 (1차 → 2차)
//
// 사용:
//   <CategoryPicker value={categoryId} onChange={setCategoryId} />

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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

  const label = useMemo(() => getLabel(value), [value, getLabel])

  const hoveredRoot = useMemo(
    () => tree?.find((r) => r.id === hoveredRootId) ?? tree?.[0],
    [tree, hoveredRootId],
  )

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
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex">
            {/* 1차 카테고리 */}
            <ul className="w-1/2 max-h-72 overflow-y-auto border-r border-gray-100">
              {tree.map((root) => (
                <li key={root.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredRootId(root.id)}
                    onClick={() => {
                      // 자식 없으면 1차만 선택
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

            {/* 2차 카테고리 */}
            <ul className="w-1/2 max-h-72 overflow-y-auto">
              {hoveredRoot?.children.length ? (
                hoveredRoot.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(child.id)
                        setOpen(false)
                      }}
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
        </>
      )}
    </div>
  )
}
