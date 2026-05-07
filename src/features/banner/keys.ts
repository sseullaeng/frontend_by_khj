export const bannerKeys = {
  all:    () => ['banner'] as const,
  active: () => [...bannerKeys.all(), 'active'] as const,
}
