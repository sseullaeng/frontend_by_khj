// 알림 타입: 채팅, 거래, 리뷰, 포인트, 시스템
export type NotificationType =
  | 'CHAT'         // 채팅 알림
  | 'TRANSACTION' // 거래 알림
  | 'REVIEW'       // 리뷰 알림
  | 'POINT'        // 포인트 알림
  | 'SYSTEM'       // 시스템 알림

// 알림 정보
export interface Notification {
  id: number          // 알림 고유 ID
  type: NotificationType  // 알림 타입
  title: string       // 알림 제목
  body: string        // 알림 내용
  linkUrl: string | null  // 관련 링크
  isRead: boolean      // 읽음 여부
  createdAt: string    // 생성일시
}
