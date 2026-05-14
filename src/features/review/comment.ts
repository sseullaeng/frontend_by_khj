// 한줄평 표시 유틸 — 라운드14 6-B/C
//
// 백엔드 마스킹 룰 (자세히는 types.ts 참조):
//   - 본인(reviewer/reviewee) view → comment 원본
//   - 제3자 + contentVisible=true  → comment 원본
//   - 제3자 + contentVisible=false → comment=null (백엔드 마스킹)
//
// 두 가지 null 케이스가 있는데 contentVisible flag 로 구분 가능:
//   - contentVisible=false → 명시적 비공개 "내용 비공개"
//   - contentVisible=true  → 작성자가 한줄평을 안 적은 케이스 → 별점 기반 디폴트 합성

import type { Review } from './types'

const DEFAULT_BY_RATING: Record<number, string> = {
  5: '아주 만족스러운 거래였어요!',
  4: '친절하고 좋은 거래였어요.',
  3: '무난한 거래였어요.',
  2: '아쉬운 부분이 있었어요.',
  1: '거래가 원활하지 않았어요.',
}

/** 카드/리스트 표시용 한줄평 텍스트 + 표시 상태 */
export type ReviewCommentDisplay =
  | { kind: 'text'; text: string }                 // 원본 또는 디폴트
  | { kind: 'hidden' }                              // 비공개 처리

export function commentToDisplay(review: Review): ReviewCommentDisplay {
  if (review.comment) return { kind: 'text', text: review.comment }
  // null 이지만 contentVisible=true → 작성자가 빈 채로 등록 → 별점 기반 디폴트
  if (review.contentVisible) {
    const fallback = DEFAULT_BY_RATING[Math.round(review.rating)] ?? '리뷰가 등록됐어요.'
    return { kind: 'text', text: fallback }
  }
  // 명시적 비공개 (대상자가 토글로 가린 상태)
  return { kind: 'hidden' }
}
