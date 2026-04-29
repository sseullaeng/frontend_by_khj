# 쓸랭(Sseulang) 프론트엔드 프로젝트 가이드

> **마지막 업데이트**: 2026-04-28
> **대상**: 프론트엔드 작업자(PM 겸임)
> **연계 문서**: `docs/SSEULANG_BACKEND_GUIDE.md`, `docs/AUTH_SECURITY.md`

---

## 1. 프로젝트 개요

- **서비스**: 쓸랭 — 중고 거래 + 대여 + 나눔 + 배달대행 통합 C2C 플랫폼
- **유스케이스**: 49개 (일반 39 + 관리자 10)
- **개발 일정**: **12일 개발 (4/28 ~ 5/9) + 2일 배포·데모 (5/10 ~ 5/11)**
  - 백엔드 개발 마감: **5/6** (백엔드는 5/7~5/9 통합 QA·버그픽스)
  - 프론트 개발 마감: **5/9** (백엔드 마감 후 3일 동안 후반 도메인 마무리 + 반응형 + QA)
- **방향성**: 백엔드 A안(49UC 풀 + 토스 실연동 + WebSocket)과 동일 스코프
- **데모 데드라인**: 2026-05-11

---

## 2. 기술 스택 (확정)

### 2.1 Core

| 영역 | 선택 | 비고 |
|------|------|------|
| 언어 | TypeScript 5.x | strict 모드 |
| 빌드 | Vite 5.x | dev 서버 빠름 |
| 프레임워크 | React 18 | concurrent features 사용 안 함(과제 X) |
| 스타일 | Tailwind CSS 3.x | 디자인 시스템 자체 구축 시간 절약 |
| 라우팅 | React Router v6 | v7 마이그 비권장(작업 중 위험) |

### 2.2 상태 / 데이터

| 라이브러리 | 용도 |
|------------|------|
| Zustand | 클라이언트 상태 (인증·UI·토스트) |
| **TanStack Query (React Query) v5** | 서버 상태 (캐시·리트라이·infinite query) |
| **MSW (Mock Service Worker)** | 백엔드 미완성 영역의 mock — 네트워크 레벨 가로채기로 실연동 시 코드 변경 0 |

### 2.3 폼 / 검증

| 라이브러리 | 용도 |
|------------|------|
| React Hook Form | 폼 상태 |
| Zod | 스키마 + 백엔드 응답 타입 검증 |

### 2.4 통신

| 라이브러리 | 용도 |
|------------|------|
| Axios | HTTP — 인터셉터로 쿠키/CSRF 헤더/401 자동 갱신 처리 |
| **`@stomp/stompjs` + `sockjs-client`** | WebSocket+STOMP (채팅·실시간 알림). **mock 불가, 실서버 필수** |

### 2.5 결제 / 외부

| 라이브러리 | 용도 |
|------------|------|
| **`@tosspayments/payment-widget-sdk`** | 토스 결제 위젯 (충전·거래 결제) |
| **카카오맵 JavaScript SDK** | 배달 기사 위치 (`driver_lat/lng`) 표시 |

### 2.6 UI 보조

| 라이브러리 | 용도 |
|------------|------|
| **`browser-image-compression`** | S3 5MB 제한 대응 — 업로드 전 클라 압축 |
| react-dropzone | 이미지 드래그&드롭 |
| **Recharts** | 관리자 통계 대시보드 |
| **`date-fns`** | 채팅 타임스탬프, 상대 시간 ("5분 전") |
| **`sonner`** (또는 react-toastify) | 에러/성공 토스트 — `ErrorCode` → 한국어 메시지 매핑 |

### 2.7 테스트 / 품질

| 라이브러리 | 용도 |
|------------|------|
| Vitest | 유닛 테스트 |
| React Testing Library | 컴포넌트 테스트 |
| Playwright (선택) | 핵심 E2E (로그인/결제) — 시간 남으면 |
| ESLint + Prettier | 린트·포맷 |

### 2.8 배포

| 영역 | 선택 |
|------|------|
| 호스팅 | Vercel (간편) 또는 AWS S3 + CloudFront |
| 도메인 | 백엔드와 동일 루트, `app.sseulang.kr` 등 서브도메인 |
| 환경변수 | `.env.local` (개발) / Vercel 환경변수 (운영) |

---

## 3. 폴더 구조

```
src/
├── app/                    # 라우터, 글로벌 프로바이더
│   ├── App.tsx
│   ├── router.tsx          # createBrowserRouter
│   └── providers.tsx       # QueryClient, Toaster, ErrorBoundary
├── pages/                  # 라우트 단위 페이지 (lazy)
│   ├── auth/
│   ├── home/
│   ├── item/
│   ├── chat/
│   ├── transaction/
│   ├── point/
│   ├── delivery/
│   ├── mypage/
│   ├── notification/
│   └── admin/
├── features/               # 도메인별 비즈니스 로직 (UI + hook + api 묶음)
│   ├── auth/
│   │   ├── api.ts          # axios 호출
│   │   ├── hooks.ts        # useLogin, useSignup
│   │   ├── store.ts        # Zustand (currentUser)
│   │   └── components/
│   ├── item/
│   ├── chat/
│   ├── payment/
│   └── ...
├── shared/                 # 도메인 무관 재사용
│   ├── ui/                 # Button, Input, Card, Modal, Toast
│   ├── api/                # axios 인스턴스, 인터셉터, ApiResponse 타입
│   ├── lib/                # date-fns 래퍼, 유틸
│   ├── hooks/              # useDebounce, useInfiniteScroll 등
│   └── types/              # 공통 타입
├── mocks/                  # MSW 핸들러
│   ├── handlers/
│   └── browser.ts
└── styles/
    └── globals.css         # Tailwind base
```

### 3.1 폴더 룰
- **`pages/`**: 라우트 컴포넌트만, 비즈니스 로직 X (features 호출)
- **`features/`**: 도메인 단위 묶음. 다른 feature import 최소화 (cross-feature는 shared 통해)
- **`shared/`**: 어떤 feature든 쓸 수 있는 공통
- **import 방향**: `pages → features → shared` (역방향 금지)

---

## 4. 핵심 설계 결정

### 4.1 인증 흐름 (백엔드 §4.1과 정합)

**쿠키 기반 (HttpOnly + Secure + SameSite=Strict)** — 토큰을 JS에서 직접 다루지 않는다.

- 로그인 성공 시 백엔드가 `Set-Cookie`로 AT/RT/CSRF 토큰을 박음. 프론트는 **Zustand에 user 정보만 저장** (토큰 X).
- 모든 요청에 `withCredentials: true` 강제.
- **CSRF**: 쿠키로 받은 `XSRF-TOKEN` 값을 `X-XSRF-TOKEN` 헤더에 echo (axios 인터셉터).
- **401 자동 갱신**: 응답 인터셉터에서 `AUTH_TOKEN_EXPIRED` 감지 → `POST /api/v1/auth/refresh` 호출 → 원 요청 재시도. 동시 401 다발 시 **단일 in-flight Promise**로 묶어 race 방지.
- **로그아웃**: `POST /api/v1/auth/logout` → Zustand 초기화 → `/login`으로.

```typescript
// shared/api/axios.ts (예시)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = readCookie('XSRF-TOKEN');
  if (csrf) config.headers['X-XSRF-TOKEN'] = csrf;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  const code = error.response?.data?.error?.code;
  if (code === 'AUTH_TOKEN_EXPIRED' && !error.config._retry) {
    error.config._retry = true;
    await refreshOnce();          // 동시 호출 단일화
    return api(error.config);
  }
  throw error;
});
```

### 4.2 API 응답 처리

백엔드 응답은 **항상** 다음 셋 중 하나 (백엔드 §4.3):

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; traceId: string } };

type PageResponse<T> = {
  content: T[];
  page: number; size: number;
  totalElements: number; totalPages: number;
  hasNext: boolean; hasPrevious: boolean;
};
```

- axios 응답 인터셉터에서 `success: false`면 `BusinessError(code, message, traceId)` throw → React Query `onError` → 토스트.
- 성공 응답은 `data` 만 unwrap해서 hook에 전달.
- **traceId**는 토스트 footer에 작게 표시 (버그 리포트 시 추적용).

### 4.3 라우팅 / 권한

- `<ProtectedRoute>` — 비로그인 → `/login` 리다이렉트
- `<AdminRoute>` — `currentUser.role !== 'ADMIN'` → 403 페이지
- `<PublicOnlyRoute>` — 로그인된 사용자가 `/login` 접근 시 `/`로
- 라우터: `createBrowserRouter` + `loader` 활용해서 페이지 진입 시 데이터 prefetch (선택)

### 4.4 WebSocket (STOMP)

채팅 + 실시간 알림 모두 STOMP 한 채널로.

- **연결**: `Authorization` 헤더 X (쿠키 자동 전송) + `withCredentials: true`. 백엔드는 첫 CONNECT 프레임에서 세션 인증.
- **구독 토픽**:
  - `/user/queue/messages` — 본인 채팅 수신
  - `/user/queue/notifications` — 본인 알림 수신
  - `/topic/chat-room/{roomId}` — 특정 채팅방 메시지 (입장 시 구독)
- **재연결**: STOMP 자체 reconnect + 지수 백오프, 최대 30초.
- **메시지 페이징**: REST `GET /api/v1/chat-rooms/{id}/messages?before={id}&size=30` (커서) — 초기 로드 + 위로 스크롤.
- **상태 관리**: `useChatRoom(roomId)` 훅이 React Query infinite + WS subscribe 합성.

### 4.5 결제 (토스 위젯)

```
1. 충전 화면 → POST /api/v1/payments/charge { amount }
   ← { paymentKey, orderId, amount, customerKey }
2. 토스 위젯 SDK 띄움 (paymentKey 사용)
3. 사용자 결제 → 토스 콜백 URL로 redirect
4. 콜백 페이지에서 POST /api/v1/payments/charge/confirm { paymentKey, orderId, amount }
   ← 성공 시 잔액 갱신
5. 백엔드가 토스 API로 금액 재검증 + 웹훅 수신
```

- **멱등성**: `orderId`는 백엔드가 발급한 `merchant_uid` 그대로 사용 (재시도 시 동일).
- **에러**: 결제 실패는 토스 SDK 콜백에서 받아 사용자에게 안내. 잔액 갱신은 React Query `invalidateQueries(['point', 'balance'])`.

### 4.6 이미지 업로드 (Presigned URL)

```
1. browser-image-compression으로 클라 압축 (5MB 이하 + 긴 변 1920px)
2. POST /api/v1/files/presigned-url { purpose: 'item', files: [{name, contentType, size}] }
   ← { uploads: [{ presignedUrl, key }] }
3. 각 presignedUrl로 PUT (Content-Type 일치)
4. 등록/수정 API에 key 배열 전달 (백엔드가 S3 HEAD 검증)
```

- 진행률: axios `onUploadProgress` → 컴포넌트 progress 바.
- 실패 시 이미지 단위 재시도, 페이지 단위 abort 가능.

### 4.7 Mock 전략 (MSW)

백엔드 도메인이 아직 안 끝난 영역(D1~D3 시점의 Item·Chat·Payment 등)은 **MSW로 mock**.

- `mocks/handlers/`에 도메인별 `*.handlers.ts` 분리.
- 응답 포맷은 **백엔드 `ApiResponse<T>` 그대로** — 실연동 전환 시 핸들러만 끄면 끝.
- 백엔드가 OpenAPI(Swagger) 스냅샷을 공유하면 → `openapi-typescript`로 타입 자동 생성 + MSW 핸들러도 일부 자동.

### 4.8 에러 처리

| 영역 | 처리 |
|------|------|
| 폼 검증 (Zod) | 필드 inline 메시지 |
| 비즈니스 에러 (`ITEM_NOT_FOUND` 등) | 토스트 + 상세 페이지면 fallback UI |
| 인증 에러 (`AUTH_*`) | 401 자동 갱신 시도 → 실패 시 로그아웃 + `/login` |
| 네트워크/5xx | 토스트 "잠시 후 다시 시도" + 자동 retry (React Query 기본 3회) |
| 알 수 없는 에러 | ErrorBoundary 페이지 (traceId 노출) |

`ErrorCode` enum → 한국어 메시지 매핑 테이블은 **백엔드가 D2까지 공유** 후 `shared/lib/errorMessages.ts`에 박는다.

---

## 5. 49UC → 화면 매핑

### 5.1 일반 사용자 (39UC → 약 28화면)

| 도메인 | 화면 | 백엔드 의존 |
|---|---|---|
| 인증 | 로그인 / 회원가입(로컬) / 소셜 콜백 / 로그아웃(헤더) | BE D2~3 |
| 마이페이지 | 내 프로필 조회·수정 / 회원 탈퇴 / 다른 사용자 프로필(신뢰도+리뷰) | BE D3 |
| 홈 | 메인(배너+카테고리+추천) / 카테고리 페이지 | BE D4·D9 |
| 상품 | 검색·필터(해시태그) / 상품 상세 / 상품 등록 / 상품 수정 / 위시리스트 / 신고 모달 | BE D4 |
| 채팅 (WS) | 채팅방 목록 / 채팅방 상세(메시지+이미지) | BE D6 |
| 거래 | Stepper(채팅중→예약→완료) / 거래 시작 액션 | BE D5 |
| 결제·포인트 | 충전(토스) / 잔액·내역 / 출금 신청 / 출금 내역 | BE D7·D8 |
| 배달대행 | 신청 폼 / 상태 추적(지도) | BE D8 |
| 알림 | 드롭다운(헤더) / 알림 페이지 | BE D6 |
| 차단·신고 | 차단 목록 | BE D5 |
| 리뷰 | 거래 후 작성 / 작성 대기 목록 | BE D5 |
| 공지·배너 | 공지 목록·상세 / 메인 배너(임베드) | BE D9 |

### 5.2 관리자 (10UC → 10화면)

관리자 로그인 / 통계 대시보드(Recharts) / 회원관리·차단 / 물품관리 / 신고처리 / 보증금반환 / 출금 승인·거부 / 배달 모니터링 / 공지 CRUD / 배너 CRUD

---

## 6. 마일스톤 — 12일 개발 + 2일 배포·데모

> **개발 12일 (4/28~5/9)**: 백엔드 도메인 완료에 +0~1일 따라가며 49UC 화면 작성.
> **백엔드 마감(5/6) 이후 3일 (5/7~5/9)**: 후반 도메인(관리자/잔여) 마무리 + 반응형 + 통합 QA #1.
> **배포·데모 2일 (5/10~5/11)**: 통합 QA #2 + 배포 + 데모.

### 6.1 백엔드 동기 개발 구간 (D1~D9, 4/28~5/6)

| 일자 | BE (확정) | FE (제안) | 핵심 산출물 |
|---|---|---|---|
| **D1** 4/28 (월) | Item CRUD | 셋업 + Tailwind + Design Token + **Axios 인터셉터(쿠키/CSRF/401 자동갱신)** + MSW 셋업 + 라우팅 골격 + 공통 컴포넌트 시작 | 빌드 OK, 라우터 동작 |
| **D2** 4/29 (화) | Item 검색/S3 | 공통 컴포넌트 완성(Button/Input/Card/Modal/Toast) + Header/Nav + **Auth UI 4종 + 실연동(BE Auth 끝남)** + ErrorCode 매핑 | 로그인·가입 실서버 동작 |
| **D3** 4/30 (수) | Transaction/Chat/Review/Block | 메인(배너+카테고리) + 검색·필터 + 상품 카드 그리드 + 위시리스트 + 마이페이지 | 메인·검색 동작 |
| **D4** 5/1 (목) | Message/Notification/**WebSocket** | 상품 상세 + 이미지 갤러리 + 신고 모달 + 다른 사용자 프로필 + 받은 리뷰 + 차단 목록 | 상세 동선 완성 |
| **D5** 5/2 (금) | Payment(토스) | 상품 등록·수정 + Presigned URL + 이미지 압축·업로드 + 거래 Stepper + 리뷰 작성 | 등록·거래 동작 |
| **D6** 5/3 (토) | Point/출금/Delivery | **채팅(STOMP 실연동)** + 채팅방 목록·상세 + 알림 드롭다운·페이지(WS 수신) | 채팅·실시간 동작 |
| **D7** 5/4 (일) | Notice/Banner/Admin | **결제 위젯 충전 + 포인트 잔액·내역 + 출금 신청** | 돈 흐름 동작 |
| **D8** 5/5 (월) | (예비) | 배달대행(지도+상태) + 공지·배너 + 알림 잔여 + 일반 UC 자체 점검 | 일반 UC 28개 종료 |
| **D9** 5/6 (화) | **개발 마감 + 통합 QA 시작** | **관리자 페이지 절반(회원관리·통계·물품관리·신고처리·출금승인)** | 핵심 관리자 5종 동작 |

### 6.2 프론트 단독 마무리 구간 (D10~D12, 5/7~5/9)

> 백엔드는 통합 QA·버그픽스 모드. 프론트는 후반 화면 + 반응형 + QA #1.

| 일자 | BE (병행) | FE (제안) | 핵심 산출물 |
|---|---|---|---|
| **D10** 5/7 (수) | 통합 QA + 버그픽스 | **관리자 페이지 나머지 5종**(보증금반환·배달모니터링·공지·배너·관리자 로그인) + Recharts 통계 마무리 | 49UC 전부 동작 |
| **D11** 5/8 (목) | 통합 QA + 버그픽스 | **반응형(모바일·태블릿)** + MSW 핸들러 전부 제거 + 실서버 베이스 URL 전환 + 통합 QA #1 (49UC 시나리오 워크스루) | 모바일 OK, QA 리포트 v1 |
| **D12** 5/9 (금) | 통합 QA 마감 | **버그 픽스 + UX 다듬기 + 에러 메시지 한글화 + 데모 시나리오 리허설** — **개발 마감** | RC 빌드 |

### 6.3 배포·데모 구간 (D13~D14, 5/10~5/11)

| 일자 | 작업 | 산출물 |
|---|---|---|
| **D13** 5/10 (토) | 통합 QA #2 + 성능 점검(Lighthouse) + Critical 버그 핫픽스 + 배포 리허설 | 데모 시나리오 통과 |
| **D14** 5/11 (일) | **배포** (Vercel 또는 S3+CF) + HTTPS + 도메인 + **데모** | **출시** |

### 6.4 위험 영역 (앞쪽 배치)

- **D1**: Axios 인터셉터(쿠키+CSRF+401 자동 갱신) — 인증 흐름의 뼈대. 막히면 D2 Auth 실연동도 막힘
- **D2**: Auth 실연동 첫날 — 백엔드와 쿠키 정책(domain/path/SameSite) 정합
- **D6**: STOMP 실연동 — 인증 통합 막히면 채팅 전체가 막힘 (BE D6과 동일 시점, 백엔드와 합석 디버깅 권장)
- **D7**: 토스 결제 위젯 콜백 처리 — 충전 한 건 끝까지 성공시키기

### 6.5 생존 룰

1. **Happy path 먼저**, 엣지는 `// TODO(5/11 이후):` 주석
2. **매일 저녁 30분 회고** + 진척률 백엔드와 공유
3. **MSW 핸들러는 항상 BE OpenAPI 포맷과 동일하게** — D11 실연동 전환 시 코드 변경 0
4. **D4(5/1) 진행률 50% 미만 → §7 🟢 컷, D6(5/3) 진행률 70% 미만 → 🟡 일부 컷**
5. **D12(5/9) 종료 시 신규 기능 작업 금지** — 이후 2일은 무조건 QA·버그픽스·배포만

---

## 7. 우선순위 컷오프 (일정 미끄러질 때 대비)

| Tier | 화면 | 빠지면 |
|---|---|---|
| **🔴 Must** (데모 필수) | Auth, 메인, 검색, 상품 상세, 상품 등록, 채팅, 거래, 충전·결제, 포인트, 마이페이지, 알림 | 서비스 정의 자체 X |
| **🟡 Should** | 위시리스트, 신고, 차단, 리뷰, 배달대행, 공지·배너, 출금 | 데모 완성도 낮아짐 |
| **🟢 Nice** | 관리자 페이지 10개 → **회원관리 + 통계만** 남기고 나머지 5/11 이후 | 관리자 데모는 1화면으로 갈음 |

D9~D10 진행률 50% 미만 시 🟢부터 컷.

---

## 8. 백엔드와의 인터페이스 계약

### 8.1 백엔드(서버 작업자)가 D1~D2까지 줄 자료

- [ ] **OpenAPI(Swagger) JSON 스냅샷** — Auth/User 도메인부터, 도메인 추가 시 갱신
- [ ] **`ApiResponse` / `PageResponse` 타입 + 샘플 JSON 묶음**
- [ ] **인증 흐름 시퀀스 다이어그램** — 쿠키/CSRF/RT Rotation/401 재시도
- [ ] **`ErrorCode` enum 표** — 코드 + 한국어 메시지 + HTTP status (현재 `docs/AUTH_SECURITY.md`에 일부 있음)
- [ ] **MSW 핸들러 샘플 묶음** — 백엔드가 만들면 PM 시간 절약 + 응답 포맷 어긋날 위험 0
- [ ] **STOMP 토픽 구조 + CONNECT 인증 방식 문서**

### 8.2 프론트(작업자)가 백엔드와 합의해야 할 항목

- 쿠키 정책 (`Domain`, `Path`, `SameSite`) — 서브도메인 분리 시 중요
- 토스 결제 `successUrl` / `failUrl` — 프론트 도메인 정해진 후 백엔드 환경변수에 박음
- WebSocket 엔드포인트 URL (`wss://api.sseulang.kr/ws-stomp` 등)
- CDN/이미지 도메인 (S3 직접 vs CloudFront)
- `application-prod.yml`의 CORS 허용 도메인

### 8.3 변경 알림 채널

- API 명세 변경 시 **즉시** 슬랙/디스코드 공유 + Swagger URL 재공유
- BREAKING CHANGE는 PR 본문 + 채널 양쪽에 명시

---

## 9. 코딩 컨벤션

### 9.1 명명

- 컴포넌트 / 페이지: PascalCase (`ItemDetailPage.tsx`)
- 훅: camelCase + `use` 접두 (`useChatRoom.ts`)
- API 함수: camelCase (`getItem`, `createTransaction`)
- 타입: PascalCase + `Request`/`Response` 접미 (`ItemCreateRequest`)
- 폴더: kebab-case (`chat-room/`) 또는 단수형 단어 1개 (`item/`)

### 9.2 컴포넌트

- 함수형 컴포넌트만, default export 지양 (named export 우선)
- props 타입은 `interface XxxProps` 또는 inline `{...}: { ... }`
- 스타일: Tailwind 우선, 복잡하면 `cn()` 헬퍼로 조건 분기 (`clsx` + `tailwind-merge`)
- 아이콘: `lucide-react` 통일

### 9.3 React Query 키

- 도메인별 키 팩토리 (`itemKeys.detail(id)`, `itemKeys.list(filter)`) — 변경 1곳 관리
- 무효화는 가장 좁은 키부터 (`invalidateQueries(itemKeys.detail(id))`)

### 9.4 Zustand 스토어

- 도메인별 스토어 분리 (`authStore`, `uiStore`, `chatStore`)
- selector 패턴 강제 (`useAuthStore(s => s.user)`) — 불필요 리렌더 방지
- persist는 인증·언어 등 최소 영역에만

### 9.5 환경변수

- `VITE_` 접두 강제 (Vite 룰)
- `.env.example` 항상 동기화
- 백엔드 base URL은 `VITE_API_BASE`, WS는 `VITE_WS_URL`

---

## 10. 테스트 전략

| 영역 | 강도 | 도구 |
|------|------|------|
| 인증 인터셉터 (401 자동 갱신, CSRF echo) | 🔒 필수 | Vitest + MSW |
| 결제 콜백 처리 (성공/실패) | 🔒 필수 | Vitest |
| 폼 검증 (Zod 스키마) | 권장 | Vitest |
| 컴포넌트 (Button, Input 등 공통 UI) | 권장 | RTL |
| 페이지 통합 | 핵심 동선만 | RTL or Playwright |
| 채팅 / WS | 수동 QA | — |

- 커버리지 강제는 안 함 (시간 부족). 단, **돈 / 인증 흐름은 단위 테스트 필수**.

---

## 11. 절대 금지 사항

- ❌ JS에서 토큰 직접 다루기 (HttpOnly 쿠키 우회 금지)
- ❌ 응답 포맷을 `ApiResponse<T>` 외 형태로 가공해서 컴포넌트에 전달
- ❌ Mock 데이터 응답 형태를 백엔드와 다르게 만들기
- ❌ 페이지에 비즈니스 로직 박기 (features 또는 hooks로 추출)
- ❌ 한 feature가 다른 feature 내부 import (cross-feature는 shared 통해)
- ❌ Tailwind 클래스 동적 조립 시 문자열 합성 (`'bg-' + color`) — purge 깨짐, `cn()`로 조건 분기
- ❌ React Query 캐시 키를 문자열 직조립 — 도메인 키 팩토리 사용
- ❌ Console.log 커밋 (lint rule로 차단)
- ❌ 결제 / 인증 코드를 테스트 없이 작성

---

## 12. TODO (5/11 이후 추가 가능)

- 다크모드
- 국제화 (i18n)
- PWA (모바일 설치 가능)
- 푸시 알림 (FCM)
- 이미지 lazy loading + 무한 스크롤 가상화
- E2E 테스트 (Playwright) 핵심 동선
- Storybook (디자인 시스템 카탈로그)
- 검색 자동완성 (백엔드 ES 도입 후)

---

## 13. 참고 — PM과 합의할 항목

- [ ] 디자인(피그마) 완성도 — D1 시작 전 어디까지 그려져 있나
- [ ] 모바일 우선 vs 데스크톱 우선 — Tailwind 브레이크포인트 기준
- [ ] 호스팅 — Vercel vs S3+CloudFront (도메인 + HTTPS 정책)
- [ ] 디자인 토큰 — 컬러/타이포/스페이싱 합의 (D1)
- [ ] 49UC 컷오프 — 🟢 영역 어디까지 자를지 사전 공감대

---

**🚀 출발선**: D1(4/28) — 셋업 + Axios 인터셉터 + MSW + 라우팅 골격.
**🏁 도착선**: D14(5/11) — 데모 + 배포.
