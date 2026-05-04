// 백엔드 ErrorCode → 한국어 메시지 (가이드 §4 전체 정합)
//
// 백엔드는 error.message 자체가 한국어이지만, 프론트가 UX-맞춤 멘트로
// 갈아치우고 싶은 경우만 여기 매핑. 나머지는 BusinessError.message 사용.

const ERROR_MESSAGES: Record<string, string> = {
  // ── 인증/권한 ─────────────────────────────────────────────
  AUTH_LOGIN_FAILED:                                '이메일 또는 비밀번호가 올바르지 않아요.',
  AUTH_TOKEN_MISSING:                               '로그인이 필요해요.',
  AUTH_TOKEN_EXPIRED:                               '로그인이 만료됐어요. 다시 로그인해 주세요.',
  AUTH_TOKEN_INVALID:                               '로그인 정보가 잘못됐어요. 다시 로그인해 주세요.',
  AUTH_TOKEN_REVOKED:                               '로그아웃된 세션이에요. 다시 로그인해 주세요.',
  AUTH_REFRESH_TOKEN_INVALID:                       '세션이 만료됐어요. 다시 로그인해 주세요.',
  AUTH_OAUTH_FAILED:                                '소셜 로그인에 실패했어요. 다시 시도해 주세요.',
  AUTH_EMAIL_NOT_VERIFIED:                          '이메일 인증이 필요해요. 가입 시 받은 메일을 확인해 주세요.',
  AUTH_VERIFICATION_TOKEN_INVALID:                  '잘못된 인증 링크예요.',
  AUTH_VERIFICATION_TOKEN_EXPIRED:                  '만료된 인증 링크예요. 메일을 다시 받아 주세요.',
  AUTH_VERIFICATION_RESEND_TOO_SOON:                '잠시 후 다시 시도해 주세요.',
  AUTH_EMAIL_ALREADY_LINKED_TO_DIFFERENT_PROVIDER:  '다른 SNS로 이미 가입된 이메일이에요.',
  USER_BLOCKED:                                     '차단된 계정이에요.',

  // ── 물품 ──────────────────────────────────────────────────
  ITEM_NOT_FOUND:               '상품을 찾을 수 없어요.',
  ITEM_FORBIDDEN:               '본인 물품에서만 가능한 동작이에요.',
  ITEM_INVALID_STATE:           '현재 상태에서는 가능한 동작이 아니에요.',
  ITEM_IMAGE_LIMIT_EXCEEDED:    '이미지는 최대 5장까지 등록할 수 있어요.',
  ITEM_IMAGE_NOT_FOUND:         '해당 이미지를 찾을 수 없어요.',
  ITEM_IMAGE_ORDER_MISMATCH:    '이미지 순서가 기존 목록과 일치하지 않아요.',

  // ── 거래(Transaction) ─────────────────────────────────────
  TRANSACTION_NOT_FOUND:        '거래를 찾을 수 없어요.',
  TRANSACTION_FORBIDDEN:        '거래 참여자만 가능해요.',
  TRANSACTION_INVALID_STATE:    '현재 상태에서는 가능한 동작이 아니에요.',
  TRANSACTION_RESERVED_BY_OTHER:'다른 거래가 먼저 예약됐어요.',
  TRANSACTION_SELF_NOT_ALLOWED: '본인 물품은 거래할 수 없어요.',

  // ── 결제 / 포인트 / 출금 ──────────────────────────────────
  INSUFFICIENT_POINT:               '포인트가 부족해요.',
  PAYMENT_AMOUNT_MISMATCH:          '결제 금액이 맞지 않아요. 고객센터로 문의해 주세요.',
  PAYMENT_DUPLICATED:               '이미 처리된 결제예요.',
  EXTERNAL_API_ERROR:               '결제 검증 중 일시적 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
  WITHDRAWAL_IDEMPOTENCY_MISMATCH:  '같은 키로 이미 다른 출금이 신청됐어요.',
  WITHDRAWAL_NOT_CANCELABLE:        '승인된 출금은 취소할 수 없어요.',

  // ── 리뷰 ──────────────────────────────────────────────────
  REVIEW_DUPLICATED:           '이미 작성한 리뷰가 있어요.',
  REVIEW_PERIOD_EXPIRED:       '리뷰 작성 기간(7일)이 지났어요.',

  // ── 고객지원 (라운드7) ────────────────────────────────────
  INQUIRY_NOT_FOUND:           '문의를 찾을 수 없어요.',
  INQUIRY_FORBIDDEN:           '본인 문의에서만 가능해요.',
  INQUIRY_INVALID_STATE:       '답변이 시작된 문의는 변경할 수 없어요.',
  SUPPORT_POST_NOT_FOUND:      '게시글을 찾을 수 없어요.',

  // ── 채팅 / 찜 / 신고 ──────────────────────────────────────
  CHAT_ROOM_NOT_FOUND:         '채팅방을 찾을 수 없어요.',
  CHAT_FORBIDDEN:              '채팅 참여자만 가능해요.',
  CHAT_MESSAGE_EMPTY:          '내용 또는 이미지 중 하나는 필요해요.',

  // ── 배달 ──────────────────────────────────────────────────
  DELIVERY_ALREADY_ACCEPTED:       '다른 라이더가 이미 수락한 배달이에요.',
  DELIVERY_SELF_NOT_ALLOWED:       '본인 요청은 수락할 수 없어요.',
  DELIVERY_INVALID_STATE:          '현재 상태에서는 가능한 동작이 아니에요.',
  DELIVERY_LOCATION_TOO_FREQUENT:  '위치 전송 간격이 너무 짧아요. 잠시 후 다시 시도해 주세요.',
  DELIVERY_LOCATION_INVALID:       '위치 정보가 한국 범위를 벗어났어요.',
  PAYLOAD_TOO_LARGE:               '요청 크기가 너무 커요.',

  // ── 시스템 ────────────────────────────────────────────────
  INVALID_REQUEST:             '입력값을 확인해 주세요.',
  RESOURCE_NOT_FOUND:          '요청하신 리소스를 찾을 수 없어요.',
  FORBIDDEN:                   '접근 권한이 없어요.',
  INTERNAL_SERVER_ERROR:       '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
}

/**
 * 에러 코드를 한국어 메시지로 변환.
 * 매핑 없으면 generic fallback. 호출부에서는 BusinessError.message 우선 사용 권장.
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? '알 수 없는 오류가 발생했어요.'
}
