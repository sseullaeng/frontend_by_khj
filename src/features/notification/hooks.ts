// 알림 훅 — REST 목록/읽음 + 글로벌 STOMP 실시간 (가이드 §9 / §10.10)
//
// 실시간: /user/queue/notifications 구독 (Spring 자동 라우팅, 본인 한정)
// 안 읽은 개수 / 모두 읽음 — 백엔드 endpoint 미제공 → 클라이언트 derive

import { createElement, useEffect, useRef } from 'react'
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

function notificationTone(noti: Notification): { label: string; icon: string; color: string; badge: string } {
  if (noti.linkType === 'INQUIRY') {
    return { label: '문의', icon: 'Q', color: 'text-violet-700 bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-700' }
  }
  if (noti.type === 'DELIVERY' || noti.linkType === 'DELIVERY') {
    return { label: '배달', icon: 'D', color: 'text-sky-700 bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-700' }
  }
  if (noti.type === 'ESCROW' || noti.linkType === 'ESCROW') {
    return { label: '거래대행', icon: 'E', color: 'text-orange-700 bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700' }
  }
  if (noti.type === 'TRANSACTION' || noti.linkType === 'TRANSACTION') {
    return { label: '거래', icon: 'T', color: 'text-amber-700 bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' }
  }
  if (noti.type === 'REVIEW' || noti.linkType === 'REVIEW') {
    return { label: '리뷰', icon: 'R', color: 'text-pink-700 bg-pink-50 border-pink-200', badge: 'bg-pink-100 text-pink-700' }
  }
  if (noti.type === 'CHAT' || noti.type === 'MESSAGE' || noti.linkType === 'CHAT_ROOM') {
    return { label: '채팅', icon: 'C', color: 'text-blue-700 bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' }
  }
  return { label: '알림', icon: 'N', color: 'text-gray-700 bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-700' }
}

function notificationToHref(noti: Notification): string {
  if (!noti.linkType || noti.linkId == null) return '/notifications'

  const map: Record<NotificationLinkType, string> = {
    CHAT_ROOM: '/notifications',
    TRANSACTION: `/mypage/trades/${noti.linkId}`,
    ESCROW: `/escrow/${noti.linkId}/buyer-info`,
    DELIVERY: `/delivery/${noti.linkId}/track`,
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
  const poppedIdsRef = useRef<Set<string>>(new Set())

  const showNotificationPopup = (noti: Notification) => {
    if (poppedIdsRef.current.has(noti.id)) return
    poppedIdsRef.current.add(noti.id)

    const openNotification = () => {
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
    }

    const tone = notificationTone(noti)
    toast.custom((id) =>
      createElement(
        'div',
        {
          className:
            'w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/15 ring-1 ring-black/5',
        },
        createElement(
          'div',
          { className: 'flex gap-3 p-4' },
          createElement(
            'div',
            {
              className: `mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${tone.color}`,
            },
            tone.icon,
          ),
          createElement(
            'div',
            { className: 'min-w-0 flex-1' },
            createElement(
              'div',
              { className: 'mb-1 flex items-center gap-2' },
              createElement(
                'span',
                { className: `rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.badge}` },
                tone.label,
              ),
              createElement('span', { className: 'h-1 w-1 rounded-full bg-gray-300' }),
              createElement('span', { className: 'text-[11px] text-gray-400' }, '새 알림'),
            ),
            createElement('p', { className: 'truncate text-sm font-semibold text-gray-950' }, noti.title),
            createElement('p', { className: 'mt-1 line-clamp-2 text-sm leading-5 text-gray-500' }, noti.content),
            createElement(
              'div',
              { className: 'mt-3 flex items-center justify-end gap-2' },
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                  onClick: () => toast.dismiss(id),
                },
                '닫기',
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600',
                  onClick: () => {
                    toast.dismiss(id)
                    openNotification()
                  },
                },
                '보기',
              ),
            ),
          ),
        ),
      ),
      {
        duration: 6000,
      },
    )
  }

  useEffect(() => {
    const unsubscribe = subscribeStomp(NOTI_QUEUE, (frame) => {
      try {
        const noti: Notification = JSON.parse(frame.body)

        showNotificationPopup(noti)

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

  useEffect(() => {
    let cancelled = false
    let initialized = false

    const syncLatestNotifications = async () => {
      try {
        const page = await notificationApi.getList({ page: 0, size: 10 }).then((r) => r.data)
        if (cancelled) return

        if (!initialized) {
          page.content.forEach((noti) => poppedIdsRef.current.add(noti.id))
          initialized = true
          return
        }

        const fresh = page.content.filter((noti) => !poppedIdsRef.current.has(noti.id))
        fresh.slice().reverse().forEach((noti) => {
          if (!noti.read) showNotificationPopup(noti)
          else poppedIdsRef.current.add(noti.id)
        })

        if (fresh.length > 0) {
          qc.setQueryData<InfiniteData<PageResponse<Notification>>>(
            notificationKeys.list(),
            (old) => {
              if (!old) return old
              const [first, ...rest] = old.pages
              if (!first) return old
              const existing = new Set(first.content.map((noti) => noti.id))
              const next = fresh.filter((noti) => !existing.has(noti.id))
              if (next.length === 0) return old
              return {
                ...old,
                pages: [{ ...first, content: [...next, ...first.content] }, ...rest],
              }
            },
          )
          qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
        }
      } catch {
        // 폴링 fallback 실패는 조용히 무시하고 다음 주기에 재시도한다.
      }
    }

    syncLatestNotifications()
    const timer = window.setInterval(syncLatestNotifications, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [qc])
}
