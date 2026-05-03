import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryApi, type CategoryNode } from './api'

const STALE_TIME = 1000 * 60 * 30  // 30분 — 자주 안 바뀜

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryApi.getTree().then((r) => r.data),
    staleTime: STALE_TIME,
  })
}

/**
 * 카테고리 ID 로 평탄화한 lookup map 반환.
 * 트리 → { [id]: { node, parent } } 형태로 변환해서 즉시 조회 가능.
 */
export function useCategoryLookup() {
  const { data, ...rest } = useCategoryTree()

  const lookup = useMemo(() => {
    const map = new Map<number, { node: CategoryNode; parent: CategoryNode | null }>()
    if (!data) return map
    for (const root of data) {
      map.set(root.id, { node: root, parent: null })
      for (const child of root.children) {
        map.set(child.id, { node: child, parent: root })
      }
    }
    return map
  }, [data])

  // 카테고리 ID → "전자기기 > 스마트폰" 형태 라벨
  const getLabel = (id: number | null | undefined): string => {
    if (id == null) return ''
    const entry = lookup.get(id)
    if (!entry) return ''
    return entry.parent ? `${entry.parent.name} > ${entry.node.name}` : entry.node.name
  }

  return { tree: data, lookup, getLabel, ...rest }
}
