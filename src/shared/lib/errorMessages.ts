/**
 * 백엔드 ErrorCode → 한국어 메시지 매핑
 * D2 시점에 백엔드가 ErrorCode enum 표 공유 후 채운다.
 */

const ERROR_MESSAGES: Record<string, string> = {
  // ── Auth ──
  AUTH_TOKEN_EXPIRED:       '로그인이 만료됐어요. 다시 로그인해 주세요.',
  AUTH_INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',
  AUTH_UNAUTHORIZED:        '로그인이 필요한 서비스예요.',
  AUTH_FORBIDDEN:           '접근 권한이 없어요.',

  // ── User ──
  USER_NOT_FOUND:           '사용자를 찾을 수 없어요.',
  USER_ALREADY_EXISTS:      '이미 가입된 이메일이에요.',
  USER_BLOCKED:             '차단된 사용자예요.',

  // ── Item ──
  ITEM_NOT_FOUND:           '상품을 찾을 수 없어요.',
  ITEM_ALREADY_SOLD:        '이미 거래가 완료된 상품이에요.',
  ITEM_FORBIDDEN:           '해당 상품을 수정할 권한이 없어요.',

  // ── Transaction ──
  TRANSACTION_NOT_FOUND:    '거래를 찾을 수 없어요.',
  TRANSACTION_INVALID_STATE:'현재 거래 상태에서 수행할 수 없는 작업이에요.',

  // ── Payment ──
  PAYMENT_FAILED:           '결제에 실패했어요. 다시 시도해 주세요.',
  PAYMENT_AMOUNT_MISMATCH:  '결제 금액이 맞지 않아요.',
  PAYMENT_ALREADY_CONFIRMED:'이미 처리된 결제예요.',

  // ── Point ──
  POINT_INSUFFICIENT:       '포인트가 부족해요.',
  POINT_WITHDRAW_MIN:       '출금 최소 금액에 미달해요.',

  // ── Chat ──
  CHAT_ROOM_NOT_FOUND:      '채팅방을 찾을 수 없어요.',

  // ── File ──
  FILE_UPLOAD_FAILED:       '파일 업로드에 실패했어요.',
  FILE_TOO_LARGE:           '파일 크기가 너무 커요 (최대 5MB).',

  // ── Delivery ──
  DELIVERY_NOT_FOUND:       '배달 정보를 찾을 수 없어요.',

  // ── Generic ──
  INTERNAL_SERVER_ERROR:    '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
  VALIDATION_ERROR:         '입력 값을 확인해 주세요.',
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? '알 수 없는 오류가 발생했어요.'
}
