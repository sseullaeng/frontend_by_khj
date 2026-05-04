// 알림 훅 — REST 목록/읽음 + 글로벌 STOMP 실시간 (가이드 §9 / §10.10)
//
// 실시간: /user/queue/notifications 구독 (Spring 자동 라우팅, 본인 한정)
// 안 읽은 개수 / 모두 읽음 — 백엔드 endpoint 미제공 → 클라이언트 derive

import { useEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationApi } from './api'
import type { Notification } from './types'
import type { PageResponse } from '@/shared/types'
import { subscribeStomp } from '@/shared/lib/stomp'

const NOTI_QUEUE = '/user/queue/notifications'

export const notificationKeys = {
  all:  ()                       => ['notifications'] as const,
  list: ()                       => [...notificationKeys.all(), 'list'] as const,
}

// 알림 목록 (페이지네이션)
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam = 0 }) =>
      notificationApi.getList({ page: pageParam, size: 20 }).then((r) => r.data),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 0,
  })
}

/**
 * 안 읽은 개수 — 백엔드 endpoint 없음 → 첫 페이지 알림에서 derive.
 * 첫 페이지(20개) 외 미반영 가능 — 정확도 보다 UX 표시용.
 */
export function useUnreadCount() {
  const { data } = useNotifications()
  return useMemo(() => {
    if (!data) return 0
    return (data as InfiniteData<PageResponse<Notification>>).pages
      .flatMap((p) => p.content)
      .filter((n) => !n.read).length
  }, [data])
}

// 단건 읽음 처리
// 가이드 §10.10 라운드6: 백엔드가 미존재 id / 타인 알림 silently 무시 → fire-and-forget OK
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      // optimistic — 캐시에서 read=true 로 표시
      await qc.cancelQueries({ queryKey: notificationKeys.list() })
      qc.setQueryData<InfiniteData<PageResponse<Notification>>>(
        notificationKeys.list(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              content: p.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
            })),
          }
        },
      )
    },
  })
}

/**
 * 모두 읽음 — 라운드9: 백엔드 PATCH /api/v1/notifications/read-all
 */
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllRead().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}

/**
 * 실시간 알림 구독 — 앱 단 한 번 마운트.
 * 새 알림 도착 시 토스트 + 캐시 무효화로 헤더 배지 자동 갱신.
 */
export function useNotificationStream() {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribeStomp(NOTI_QUEUE, (frame) => {
      try {
        const noti: Notification = JSON.parse(frame.body)

        toast(noti.title, { description: noti.content })

        // 목록 캐시 맨 앞에 prepend
        qc.setQueryData<InfiniteData<PageResponse<Notification>>>(
          notificationKeys.list(),
          (old) => {
            if (!old) return old
            const [first, ...rest] = old.pages
            if (!first) return old
            return {
              ...old,
              pages: [{ ...first, content: [noti, ...first.content] }, ...rest],
            }
          },
        )
      } catch (err) {
        console.error('notification parse error', err)
      }
    })
    return unsubscribe
  }, [qc])
}
