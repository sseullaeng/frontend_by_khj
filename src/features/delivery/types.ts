// 배달 상태: 대기중, 수락됨, 픽업완료, 배달완료, 취소됨
export type DeliveryStatus =
  | 'PENDING'    // 대기중
  | 'ACCEPTED'   // 수락됨
  | 'PICKED_UP'  // 픽업완료
  | 'DELIVERED'  // 배달완료
  | 'CANCELLED'  // 취소됨

// 배달 요청
export interface DeliveryRequest {
  pickupAddress: string    // 픽업 주소
  deliveryAddress: string   // 배달 주소
  itemDescription: string  // 물품 설명
  fee: number             // 배달료
}

// 배달 정보
export interface Delivery {
  id: number                    // 배달 고유 ID
  pickupAddress: string        // 픽업 주소
  deliveryAddress: string       // 배달 주소
  itemDescription: string      // 물품 설명
  fee: number                 // 배달료
  status: DeliveryStatus       // 배달 상태
  driverLat: number | null     // 기사 위도
  driverLng: number | null     // 기사 경도
  driverNickname: string | null  // 기사 닉네임
  createdAt: string             // 생성일시
}
