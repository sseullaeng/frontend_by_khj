export type DeliveryStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED'

export interface DeliveryRequest {
  pickupAddress: string
  deliveryAddress: string
  itemDescription: string
  fee: number
}

export interface Delivery {
  id: number
  pickupAddress: string
  deliveryAddress: string
  itemDescription: string
  fee: number
  status: DeliveryStatus
  driverLat: number | null
  driverLng: number | null
  driverNickname: string | null
  createdAt: string
}
