import { createContext } from 'react'
import type { AuthUser, SignupInput } from '../types'

export type AuthContextValue = {
  currentUser: AuthUser | null
  isAuthLoading: boolean
  register: (input: SignupInput) => Promise<AuthUser>
  login: (loginId: string, password: string, remember: boolean) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
