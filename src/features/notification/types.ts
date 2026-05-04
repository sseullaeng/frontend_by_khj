// 알림 도메인 타입 — 가이드 §10.10 정합
//
// ⚠️ id 는 MongoDB ObjectId hex string (24자), Long 아님
// ⚠️ createdAt 은 Instant (UTC offset 포함)

// 알림 타입 (영문 enum) — 라운드9 백엔드는 한글 enum, api.ts 에서 매핑
//   백엔드: 메시지/거래/리뷰/공지/시스템
//   프론트: MESSAGE/TRANSACTION/REVIEW/NOTICE/SYSTEM (+ 기존 CHAT/DELIVERY/POINT 호환)
export type NotificationType =
  | 'CHAT'
  | 'MESSAGE'
  | 'TRANSACTION'
  | 'DELIVERY'
  | 'REVIEW'
  | 'POINT'
  | 'NOTICE'
  | 'SYSTEM'

// 클라이언트 라우팅 키
export type NotificationLinkType =
  | 'CHAT_ROOM'
  | 'TRANSACTION'
  | 'DELIVERY'
  | 'ITEM'
  | 'REVIEW'
  | 'PAYMENT'
  | 'INQUIRY'        // 라운드8: 고객지원 답변 알림

export interface Notification {
  id: string                              // ⚠️ MongoDB ObjectId hex
  type: NotificationType
  title: string
  content: string                         // (이전 body → content)
  linkType: NotificationLinkType | null   // 클라 라우팅 분기 키
  linkId: number | null                   // linkType 의 row id
  read: boolean                           // (이전 isRead → read)
  createdAt: string                       // Instant (UTC)
}
