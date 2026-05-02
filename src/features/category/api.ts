// 카테고리 API — 백엔드 §8 (가이드)
//   GET /api/v1/categories       → 활성 트리 (2단 깊이: 1차 → 2차)
//   GET /api/v1/categories/{id}  → 단건
import api from '@/shared/api/axios'

export interface CategoryNode {
  id: number
  name: string
  children: CategoryNode[]
}

export const categoryApi = {
  getTree: () => api.get<CategoryNode[]>('/api/v1/categories'),
  getOne:  (id: number) => api.get<CategoryNode>(`/api/v1/categories/${id}`),
}
