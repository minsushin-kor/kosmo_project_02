type ErrorPayload = {
  detail?: string
  message?: string
  error?: string
}

const DEFAULT_API_BASE_URL = '/api'

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `요청을 처리하지 못했습니다. (${response.status})`

    try {
      const payload = await response.json() as ErrorPayload
      message = payload.detail ?? payload.message ?? payload.error ?? message
    } catch {
      // JSON 오류 응답이 아니면 상태 코드 기반 기본 문구를 사용합니다.
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof TypeError) {
    return 'Spring Boot 서버에 연결하지 못했습니다. 서버와 데이터베이스 실행 상태를 확인해 주세요.'
  }

  return error instanceof Error ? error.message : fallback
}
