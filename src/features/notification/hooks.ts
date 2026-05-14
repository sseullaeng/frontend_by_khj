// 알림 훅 — REST 목록/읽음 + 글로벌 STOMP 실시간 (가이드 §9 / §10.10)
//
// 실시간: /user/queue/notifications 구독 (Spring 자동 라우팅, 본인 한정)
// 안 읽은 개수 / 모두 읽음 — 백엔드 endpoint 미제공 → 클라이언트 derive

import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { notificationApi } from './api'
import type { Notification, NotificationLinkType } from './types'
import type { PageResponse } from '@/shared/types'
import { useAuthStore } from '@/features/auth/store'
import { subscribeStomp } from '@/shared/lib/stomp'

const NOTI_QUEUE = '/user/queue/notifications'

function notificationToHref(noti: Notification): string {
  if (!noti.linkType || noti.linkId == null) return '/notifications'

  const map: Record<NotificationLinkType, string> = {
    CHAT_ROOM: '/notifications',
    TRANSACTION: `/mypage/trades/${noti.linkId}`,
    ESCROW: `/escrow/${noti.linkId}/buyer-info`,
    DELIVERY: `/deliveries/${noti.linkId}`,
    ITEM: `/items/${noti.linkId}`,
    REVIEW: '/reviews',
    PAYMENT: '/points',
    INQUIRY: `/mypage/inquiries/${noti.linkId}`,
    OVERDUE: '/mypage/overdue',
  }

  return map[noti.linkType] ?? '/notifications'
}

export const notificationKeys = {
  all:         ()                       => ['notifications'] as const,
  list:        ()                       => [...notificationKeys.all(), 'list'] as const,
  unreadCount: ()                       => [...notificationKeys.all(), 'unread-count'] as const,
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
 * 안 읽은 개수 — 라운드14 백엔드 전용 endpoint 사용.
 *   GET /api/v1/notifications/unread-count → { unread: N }
 *   비로그인 시 호출 안 함 (401 방지). 새 알림 STOMP 도착·읽음 처리 시 invalidate.
 */
export function useUnreadCount(): number {
  const isLoggedIn = useAuthStore((s) => !!s.user)
  const { data } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data),
    enabled: isLoggedIn,
    staleTime: 30_000,
  })
  return data?.unread ?? 0
}

// 단건 읽음 처리
// 가이드 §10.10 라운드6: 백엔드가 미존재 id / 타인 알림 silently 무시 → fire-and-forget OK
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      // optimistic — 캐시에서 read=true 로 표시 + unread-count 감소
      await qc.cancelQueries({ queryKey: notificationKeys.list() })
      let wasUnread = false
      qc.setQueryData<InfiniteData<PageResponse<Notification>>>(
        notificationKeys.list(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              content: p.content.map((n) => {
                if (n.id !== id) return n
                if (!n.read) wasUnread = true
                return { ...n, read: true }
              }),
            })),
          }
        },
      )
      if (wasUnread) {
        qc.setQueryData<{ unread: number } | undefined>(
          notificationKeys.unreadCount(),
          (prev) => (prev ? { unread: Math.max(0, prev.unread - 1) } : prev),
        )
      }
    },
    onSettled: () => {
      // 서버 정합 확정 (silent miss 케이스 포함)
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
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
      // unread-count 즉시 0으로 + 서버 정합
      qc.setQueryData<{ unread: number }>(notificationKeys.unreadCount(), { unread: 0 })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

/**
 * 실시간 알림 구독 — 앱 단 한 번 마운트.
 * 새 알림 도착 시 토스트 + 캐시 무효화로 헤더 배지 자동 갱신.
 */
export function useNotificationStream() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = subscribeStomp(NOTI_QUEUE, (frame) => {
      try {
        const noti: Notification = JSON.parse(frame.body)

        toast(noti.title, {
          description: noti.content,
          position: 'bottom-center',
          duration: 5000,
          action: {
            label: '보기',
            onClick: () => {
              notificationApi.markRead(noti.id).catch(() => undefined)
              qc.setQueryData<InfiniteData<PageResponse<Notification>>>(
                notificationKeys.list(),
                (old) => {
                  if (!old) return old
                  return {
                    ...old,
                    pages: old.pages.map((page) => ({
                      ...page,
                      content: page.content.map((item) =>
                        item.id === noti.id ? { ...item, read: true } : item
                      ),
                    })),
                  }
                }
              )
              if (!noti.read) {
                qc.setQueryData<{ unread: number } | undefined>(
                  notificationKeys.unreadCount(),
                  (prev) => (prev ? { unread: Math.max(0, prev.unread - 1) } : prev)
                )
              }
              qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
              navigate(notificationToHref(noti))
            },
          },
        })

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
        // unread-count 도 +1 (서버 STOMP delta 미발행 — 클라가 직접 갱신)
        if (!noti.read) {
          qc.setQueryData<{ unread: number } | undefined>(
            notificationKeys.unreadCount(),
            (prev) => ({ unread: (prev?.unread ?? 0) + 1 }),
          )
        }
      } catch (err) {
        console.error('notification parse error', err)
      }
    })
    return unsubscribe
  }, [navigate, qc])
}
