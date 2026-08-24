import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthUser, SignupInput } from '../types'

type ApiResponse<T> = { success: boolean; data: T; message?: string; error?: string }
type BackendUser = {
  userId: number
  loginId: string
  email: string
  userName: string
  phone: string | null
  role: AuthUser['role']
}
type LoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: BackendUser
}

function toAuthUser(user: BackendUser): AuthUser {
  return {
    userId: user.userId,
    name: user.userName,
    username: user.loginId,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
  }
}

export async function signup(request: SignupInput) {
  const response = await apiRequest<ApiResponse<BackendUser>>('/auth/signup', {
    method: 'POST', body: JSON.stringify(request), skipAuth: true, suppressAuthFailure: true,
  })
  return toAuthUser(response.data)
}

export async function login(loginId: string, password: string) {
  const response = await apiRequest<ApiResponse<LoginResponse>>('/auth/login', {
    method: 'POST', body: JSON.stringify({ loginId, password }), skipAuth: true, suppressAuthFailure: true,
  })
  return { accessToken: response.data.accessToken, user: toAuthUser(response.data.user) }
}

export async function getMe(signal?: AbortSignal) {
  const response = await apiRequest<ApiResponse<BackendUser>>('/auth/me', { signal })
  return toAuthUser(response.data)
}
