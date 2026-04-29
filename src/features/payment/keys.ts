export const pointKeys = {
  all:     ()                         => ['point'] as const,
  balance: ()                         => [...pointKeys.all(), 'balance'] as const,
  history: (page: number, size = 20)  => [...pointKeys.all(), 'history', page, size] as const,
}
