// 메인 배너 (공개) — 백엔드 spec §10.8
//
// 인증 불필요. 활성(active=true) + 노출 윈도우(startsAt ~ endsAt) 통과한 배너만,
// sortOrder 오름차순으로 응답.
import api from '@/shared/api/axios'
import type { Banner } from '@/features/admin/types'  // schema 동일 — 재사용

export const bannerApi = {
  getActive: () => api.get<Banner[]>('/api/v1/banners'),
}
