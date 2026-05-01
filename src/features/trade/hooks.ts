// 거래 관련 훅: 거래 내역 조회 및 관리 기능
import { useQuery } from '@tanstack/react-query'  // React Query 훅
import { api } from '@/shared/api/axios'  // API 클라이언트
import type { Trade } from '@/features/item/types'  // 거래 타입

/**
 * 거래 상세 정보 조회 훅
 * @param tradeId 거래 ID
 * @returns 거래 상세 정보 및 로딩 상태
 */
export function useTradeDetail(tradeId: number) {
  return useQuery({
    queryKey: ['trade', tradeId],
    queryFn: async (): Promise<Trade> => {
      const { data } = await api.get(`/api/v1/trades/${tradeId}`)
      return data
    },
    enabled: !!tradeId,
  })
}

/**
 * 내 거래 내역 조회 훅
 * @returns 내 거래 내역 목록 및 로딩 상태
 */
export function useMyTrades() {
  return useQuery({
    queryKey: ['my-trades'],
    queryFn: async (): Promise<Trade[]> => {
      const { data } = await api.get('/api/v1/trades/my')
      return data
    },
  })
}
