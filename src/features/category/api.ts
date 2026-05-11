// 카테고리 API — 백엔드 §8 (가이드)
//   GET /api/v1/categories                    → 활성 트리 (2단 깊이: 1차 → 2차)
//   GET /api/v1/categories/{id}               → 단건
//   GET /api/v1/categories/search?keyword=    → 활성 카테고리 자동완성 (라운드13 PR #114)
import api from '@/shared/api/axios'

export interface CategoryNode {
  id: number
  name: string
  children: CategoryNode[]
}

// 라운드13 PR #114 — 자동완성 응답 항목 (flat list)
//   parentName 미포함 — "전자기기 > 스마트폰" 표시하려면 별도 GET /categories/{parentId} 호출 필요.
//   호출부에서 트리(getTree) 캐시 활용해 parent 이름 lookup 권장.
export interface CategorySearchItem {
  id: number
  name: string
  parentId: number | null
}

export const categoryApi = {
  getTree: () => api.get<CategoryNode[]>('/api/v1/categories'),
  getOne:  (id: number) => api.get<CategoryNode>(`/api/v1/categories/${id}`),

  // 라운드13 PR #114 — 활성 카테고리 자동완성. 검색 결과는 flat list (children 없음).
  search:  (keyword: string) =>
    api.get<CategorySearchItem[]>('/api/v1/categories/search', { params: { keyword } }),
}
