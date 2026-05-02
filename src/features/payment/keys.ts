import type { PointHistoryType } from './types'

export const pointKeys = {
  all:     ()                                 => ['point'] as const,
  balance: ()                                 => [...pointKeys.all(), 'balance'] as const,
  history: (type?: PointHistoryType, page = 0, size = 20) =>
    [...pointKeys.all(), 'history', type ?? 'all', page, size] as const,
}

export const withdrawalKeys = {
  all:    ()                       => ['withdrawal'] as const,
  list:   (page = 0, size = 20)    => [...withdrawalKeys.all(), 'list', page, size] as const,
  detail: (id: number)             => [...withdrawalKeys.all(), 'detail', id] as const,
}
