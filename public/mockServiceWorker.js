/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker (모의 서비스 워커)
 * @see https://github.com/mswjs/msw
 * 
 * 중요: 이 파일은 Mock Service Worker 라이브러리의 자동 생성 파일입니다.
 * - 이 파일을 직접 수정하지 마세요.
 * - API 모킹을 위한 서비스 워커 스크립트입니다.
 * - 개발 환경에서 실제 API 호출을 가로채서 모의 응답을 반환합니다.
 */

// Mock Service Worker 버전 정보
const PACKAGE_VERSION = '2.13.6'
const INTEGRITY_CHECKSUM = '4db4a41e972cec1b64cc569c66952d82'

// 모의 응답 심볼: 응답이 모의된 것인지 식별
const IS_MOCKED_RESPONSE = Symbol('isMockedResponse')

// 활성 클라이언트 ID 집합: 현재 연결된 클라이언트들 추적
const activeClientIds = new Set()

// 서비스 워커 설치 이벤트 리스너
addEventListener('install', function () {
  // 대기 상태 건너뛰기: 즉시 활성화
  self.skipWaiting()
})

// 서비스 워커 활성화 이벤트 리스너
addEventListener('activate', function (event) {
  // 모든 클라이언트 제어권 획득
  event.waitUntil(self.clients.claim())
})

// 메시지 이벤트 리스너: 클라이언트와 통신
addEventListener('message', async function (event) {
  // 이벤트 소스에서 클라이언트 ID 추출
  const clientId = Reflect.get(event.source || {}, 'id')

  // 클라이언트 ID가 없거나 클라이언트 목록이 없으면 종료
  if (!clientId || !self.clients) {
    return
  }

  // 클라이언트 ID로 실제 클라이언트 객체 가져오기
  const client = await self.clients.get(clientId)

  // 클라이언트가 존재하지 않으면 종료
  if (!client) {
    return
  }

  // 모든 윈도우 타입 클라이언트 목록 가져오기
  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  // 메시지 타입에 따른 처리 분기
  switch (event.data) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(client, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(client, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: {
          packageVersion: PACKAGE_VERSION,
          checksum: INTEGRITY_CHECKSUM,
        },
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)

      sendToClient(client, {
        type: 'MOCKING_ENABLED',
        payload: {
          client: {
            id: client.id,
            frameType: client.frameType,
          },
        },
      })
      break
    }

    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)

      const remainingClients = allClients.filter((client) => {
        return client.id !== clientId
      })

      // Unregister itself when there are no more clients
      if (remainingClients.length === 0) {
        self.registration.unregister()
      }

      break
    }
  }
})

addEventListener('fetch', function (event) {
  const requestInterceptedAt = Date.now()

  // Bypass navigation requests.
  if (event.request.mode === 'navigate') {
    return
  }

  // Opening the DevTools triggers the "only-if-cached" request
  // that cannot be handled by the worker. Bypass such requests.
  if (
    event.request.cache === 'only-if-cached' &&
    event.request.mode !== 'same-origin'
  ) {
    return
  }

  // Bypass all requests when there are no active clients.
  // Prevents the self-unregistered worked from handling requests
  // after it's been terminated (still remains active until the next reload).
  if (activeClientIds.size === 0) {
    return
  }

  const requestId = crypto.randomUUID()
  event.respondWith(handleRequest(event, requestId, requestInterceptedAt))
})

/**
 * @param {FetchEvent} event
 * @param {string} requestId
 * @param {number} requestInterceptedAt
 */
async function handleRequest(event, requestId, requestInterceptedAt) {
  const client = await resolveMainClient(event)
  const requestCloneForEvents = event.request.clone()
  const response = await getResponse(
    event,
    client,
    requestId,
    requestInterceptedAt,
  )

  // Send back the response clone for the "response:*" life-cycle events.
  // Ensure MSW is active and ready to handle the message, otherwise
  // this message will pend indefinitely.
  if (client && activeClientIds.has(client.id)) {
    const serializedRequest = await serializeRequest(requestCloneForEvents)

    // Clone the response so both the client and the library could consume it.
    const responseClone = response.clone()

    sendToClient(
      client,
      {
        type: 'RESPONSE',
        payload: {
          isMockedResponse: IS_MOCKED_RESPONSE in response,
          request: {
            id: requestId,
            ...serializedRequest,
          },
          response: {
            type: responseClone.type,
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: Object.fromEntries(responseClone.headers.entries()),
            body: responseClone.body,
          },
        },
      },
      responseClone.body ? [serializedRequest.body, responseClone.body] : [],
    )
  }

  return response
}

/**
 * Resolve the main client for the given event.
 * Client that issues a request doesn't necessarily equal the client
 * that registered the worker. It's with the latter the worker should
 * communicate with during the response resolving phase.
 * @param {FetchEvent} event
 * @returns {Promise<Client | undefined>}
 */
async function resolveMainClient(event) {
  const client = await self.clients.get(event.clientId)

  if (activeClientIds.has(event.clientId)) {
    return client
  }

  if (client?.frameType === 'top-level') {
    return client
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  return allClients
    .filter((client) => {
      // Get only those clients that are currently visible.
      return client.visibilityState === 'visible'
    })
    .find((client) => {
      // Find the client ID that's recorded in the
      // set of clients that have registered the worker.
      return activeClientIds.has(client.id)
    })
}

/**
 * @param {FetchEvent} event
 * @param {Client | undefined} client
 * @param {string} requestId
 * @param {number} requestInterceptedAt
 * @returns {Promise<Response>}
 */
async function getResponse(event, client, requestId, requestInterceptedAt) {
  // Clone the request because it might've been already used
  // (i.e. its body has been read and sent to the client).
  const requestClone = event.request.clone()

  function passthrough() {
    // Cast the request headers to a new Headers instance
    // so the headers can be manipulated with.
    const headers = new Headers(requestClone.headers)

    // Remove the "accept" header value that marked this request as passthrough.
    // This prevents request alteration and also keeps it compliant with the
    // user-defined CORS policies.
    const acceptHeader = headers.get('accept')
    if (acceptHeader) {
      const values = acceptHeader.split(',').map((value) => value.trim())
      const filteredValues = values.filter(
        (value) => value !== 'msw/passthrough',
      )

      // 필터링된 Accept 헤더 값이 있으면 헤더 업데이트
      if (filteredValues.length > 0) {
        headers.set('accept', filteredValues.join(', '))
      } else {
        // 필터링된 값이 없으면 Accept 헤더 삭제
        headers.delete('accept')
      }
    }

    // 수정된 헤더로 요청 전송
    return fetch(requestClone, { headers })
  }

  // 클라이언트가 활성화되지 않았으면 모킹 우회
  if (!client) {
    return passthrough()
  }

  // 초기 페이지 로드 요청 우회 (정적 자산 등)
  // 활성 클라이언트 목록에 즉시/부모 클라이언트가 없다는 것은
  // MSW가 아직 "MOCK_ACTIVATE" 이벤트를 디스패치하지 않았고
  // 요청을 처리할 준비가 되지 않았음을 의미합니다.
  if (!activeClientIds.has(client.id)) {
    return passthrough()
  }

  // 클라이언트에 요청이 가로채졌음을 알림
  const serializedRequest = await serializeRequest(event.request)
  const clientMessage = await sendToClient(
    client,
    {
      type: 'REQUEST',
      payload: {
        id: requestId,                    // 요청 고유 ID
        interceptedAt: requestInterceptedAt, // 요청 가로챈 시간
        ...serializedRequest,              // 직렬화된 요청 데이터
      },
    },
    [serializedRequest.body],  // 전송 가능한 객체 배열 (요청 본문)
  )

  // 클라이언트 메시지 타입에 따른 처리 분기
  switch (clientMessage.type) {
    case 'MOCK_RESPONSE': {
      // 모의 응답 반환: 클라이언트가 제공한 모의 데이터로 응답
      return respondWithMock(clientMessage.data)
    }

    case 'PASSTHROUGH': {
      // 우회 처리: 실제 네트워크 요청으로 전달
      return passthrough()
    }
  }

  // 기본적으로 우회 처리
  return passthrough()
}

/**
 * 클라이언트에 메시지를 보내는 함수
 * @param {Client} client - 메시지를 보낼 클라이언트 객체
 * @param {any} message - 클라이언트로 보낼 메시지 데이터
 * @param {Array<Transferable>} transferrables - 전송 가능한 객체 배열
 * @returns {Promise<any>} - 메시지 전송 결과를 담은 프로미스
 */
function sendToClient(client, message, transferrables = []) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = (event) => {
      if (event.data && event.data.error) {
        return reject(event.data.error)
      }

      resolve(event.data)
    }

    client.postMessage(message, [
      channel.port2,
      ...transferrables.filter(Boolean),
    ])
  })
}

/**
 * @param {Response} response
 * @returns {Response}
 */
function respondWithMock(response) {
  // Setting response status code to 0 is a no-op.
  // However, when responding with a "Response.error()", the produced Response
  // instance will have status code set to 0. Since it's not possible to create
  // a Response instance with status code 0, handle that use-case separately.
  if (response.status === 0) {
    return Response.error()
  }

  const mockedResponse = new Response(response.body, response)

  Reflect.defineProperty(mockedResponse, IS_MOCKED_RESPONSE, {
    value: true,
    enumerable: true,
  })

  return mockedResponse
}

/**
 * @param {Request} request
 */
async function serializeRequest(request) {
  return {
    url: request.url,
    mode: request.mode,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    cache: request.cache,
    credentials: request.credentials,
    destination: request.destination,
    integrity: request.integrity,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    body: await request.arrayBuffer(),
    keepalive: request.keepalive,
  }
}
