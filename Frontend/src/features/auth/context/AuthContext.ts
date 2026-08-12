import { createContext } from 'react'
import type { AuthResult, AuthUser, DemoAccount } from '../types'

export type AuthContextValue = {
  currentUser: AuthUser | null
  register: (account: DemoAccount) => AuthResult
  login: (username: string, password: string, remember: boolean) => AuthResult
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
