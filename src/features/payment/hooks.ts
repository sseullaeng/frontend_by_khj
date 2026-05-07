// 결제·포인트 도메인 훅 — 라운드 11 (Tx-Hold)
import { useQuery } from '@tanstack/react-query'
import { paymentApi } from './api'
import { pointKeys } from './keys'

// 포인트 잔액 (사용 가능 / 거래 보관 / 총)
//   거래 hold/release 시 invalidateQueries({ queryKey: pointKeys.balance() }) 로 재조회.
export function usePointBalance(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pointKeys.balance(),
    queryFn: () => paymentApi.getMyPoint().then((r) => r.data),
    enabled: opts?.enabled ?? true,
    staleTime: 10_000,
  })
}
