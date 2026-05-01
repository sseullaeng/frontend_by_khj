// 에러 메시지 유틸리티: 백엔드 ErrorCode를 한국어 사용자 친화적 메시지로 변환
/**
 * 백엔드에서 전달하는 ErrorCode를 한국어 메시지로 매핑하여 사용자에게 표시합니다.
 * 추후 백엔드와 ErrorCode enum을 공유하여 일관성을 확보할 예정입니다.
 */

// 에러 코드별 한국어 메시지 매핑 테이블
const ERROR_MESSAGES: Record<string, string> = {
  // ── 인증 관련 에러 ──
  AUTH_TOKEN_EXPIRED:       '로그인이 만료됐어요. 다시 로그인해 주세요.',        // 토큰 만료
  AUTH_INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',        // 로그인 실패
  AUTH_UNAUTHORIZED:        '로그인이 필요한 서비스예요.',                    // 인증 필요
  AUTH_FORBIDDEN:           '접근 권한이 없어요.',                          // 권한 없음

  // ── 사용자 관련 에러 ──
  USER_NOT_FOUND:           '사용자를 찾을 수 없어요.',                      // 사용자 없음
  USER_ALREADY_EXISTS:      '이미 가입된 이메일이에요.',                    // 중복 가입
  USER_BLOCKED:             '차단된 사용자예요.',                            // 사용자 차단됨

  // ── 물품 관련 에러 ──
  ITEM_NOT_FOUND:           '상품을 찾을 수 없어요.',                        // 물품 없음
  ITEM_ALREADY_SOLD:        '이미 거래가 완료된 상품이에요.',                // 이미 판매됨
  ITEM_FORBIDDEN:           '해당 상품을 수정할 권한이 없어요.',              // 수정 권한 없음

  // ── 거래 관련 에러 ──
  TRANSACTION_NOT_FOUND:    '거래를 찾을 수 없어요.',                        // 거래 없음
  TRANSACTION_INVALID_STATE:'현재 거래 상태에서 수행할 수 없는 작업이에요.',    // 잘못된 거래 상태

  // ── 결제 관련 에러 ──
  PAYMENT_FAILED:           '결제에 실패했어요. 다시 시도해 주세요.',            // 결제 실패
  PAYMENT_AMOUNT_MISMATCH:  '결제 금액이 맞지 않아요.',                        // 금액 불일치
  PAYMENT_ALREADY_CONFIRMED:'이미 처리된 결제예요.',                        // 중복 결제

  // ── 포인트 관련 에러 ──
  POINT_INSUFFICIENT:       '포인트가 부족해요.',                            // 포인트 부족
  POINT_WITHDRAW_MIN:       '출금 최소 금액에 미달해요.',                      // 최소 출금액 미달

  // ── 채팅 관련 에러 ──
  CHAT_ROOM_NOT_FOUND:      '채팅방을 찾을 수 없어요.',                        // 채팅방 없음

  // ── 파일 관련 에러 ──
  FILE_UPLOAD_FAILED:       '파일 업로드에 실패했어요.',                      // 업로드 실패
  FILE_TOO_LARGE:           '파일 크기가 너무 커요 (최대 5MB).',               // 파일 크기 초과

  // ── 배송 관련 에러 ──
  DELIVERY_NOT_FOUND:       '배달 정보를 찾을 수 없어요.',                    // 배송 정보 없음

  // ── 일반 에러 ──
  INTERNAL_SERVER_ERROR:    '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',  // 서버 내부 오류
  VALIDATION_ERROR:         '입력 값을 확인해 주세요.',                        // 입력값 검증 실패
}

/**
 * 에러 코드를 한국어 메시지로 변환하는 함수
 * 
 * @param code - 백엔드에서 전달받은 에러 코드
 * @returns 해당하는 한국어 에러 메시지 (없을 경우 기본 메시지 반환)
 * 
 * @example
 * getErrorMessage('AUTH_TOKEN_EXPIRED') // '로그인이 만료됐어요. 다시 로그인해 주세요.'
 * getErrorMessage('UNKNOWN_ERROR')      // '알 수 없는 오류가 발생했어요.'
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? '알 수 없는 오류가 발생했어요.'
}
