import { createContext } from 'react'
import type { AuthUser, SignupInput, UpdateProfileInput } from '../types'

export type AuthContextValue = {
  currentUser: AuthUser | null
  isAuthLoading: boolean
  register: (input: SignupInput) => Promise<AuthUser>
  login: (loginId: string, password: string, remember: boolean) => Promise<AuthUser>
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
