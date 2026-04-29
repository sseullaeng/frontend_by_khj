export type NotificationType =
  | 'CHAT'
  | 'TRANSACTION'
  | 'REVIEW'
  | 'POINT'
  | 'SYSTEM'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  body: string
  linkUrl: string | null
  isRead: boolean
  createdAt: string
}
