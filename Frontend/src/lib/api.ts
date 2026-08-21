const DEFAULT_API_BASE_URL = 'http://localhost:8080'

function getApiBaseUrl() {
    return (
        import.meta.env.VITE_API_BASE_URL?.trim() ||
        DEFAULT_API_BASE_URL
    )
}

type ApiErrorBody = {
    message?: string
    error?: string
    detail?: string
}

export class ApiError extends Error {
    status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.body
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...options.headers,
        },
    })

    if (!response.ok) {
        let message = `API 요청에 실패했습니다. (${response.status})`

        try {
            const errorBody = (await response.json()) as ApiErrorBody

            message =
                errorBody.message ||
                errorBody.detail ||
                errorBody.error ||
                message
        } catch {
            // JSON 형식의 오류 응답이 아니면 기본 메시지를 사용합니다.
        }

        throw new ApiError(message, response.status)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}