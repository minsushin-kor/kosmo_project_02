import { useMemo, useState, type ReactNode } from 'react'
import type { AuthResult, AuthUser, DemoAccount } from '../types'
import { AuthContext, type AuthContextValue } from './AuthContext'

const ACCOUNTS_KEY = 'petpulse-demo-accounts'
const LOCAL_LOGIN_KEY = 'petpulse-demo-login'
const SESSION_LOGIN_KEY = 'petpulse-demo-session-login'

type AuthProviderProps = {
  children: ReactNode
}

function readAccounts(): DemoAccount[] {
  try {
    const stored = window.localStorage.getItem(ACCOUNTS_KEY)
    return stored ? JSON.parse(stored) as DemoAccount[] : []
  } catch {
    return []
  }
}

function toAuthUser(account: DemoAccount): AuthUser {
  const { password: _password, ...user } = account
  return user
}

function readCurrentUser() {
  const username = window.localStorage.getItem(LOCAL_LOGIN_KEY)
    ?? window.sessionStorage.getItem(SESSION_LOGIN_KEY)

  if (!username) {
    return null
  }

  const account = readAccounts().find((item) => item.username === username)
  return account ? toAuthUser(account) : null
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(readCurrentUser)

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    register: (account): AuthResult => {
      const accounts = readAccounts()
      const normalizedUsername = account.username.trim()
      const duplicated = accounts.some((item) => (
        item.username.toLowerCase() === normalizedUsername.toLowerCase()
      ))

      if (duplicated) {
        return { success: false, message: '이미 사용 중인 아이디입니다.' }
      }

      const nextAccount = { ...account, username: normalizedUsername }
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, nextAccount]))
      return { success: true }
    },
    login: (username, password, remember): AuthResult => {
      const account = readAccounts().find((item) => (
        item.username.toLowerCase() === username.trim().toLowerCase() &&
        item.password === password
      ))

      if (!account) {
        return { success: false, message: '아이디 또는 비밀번호를 확인해 주세요.' }
      }

      window.localStorage.removeItem(LOCAL_LOGIN_KEY)
      window.sessionStorage.removeItem(SESSION_LOGIN_KEY)

      if (remember) {
        window.localStorage.setItem(LOCAL_LOGIN_KEY, account.username)
      } else {
        window.sessionStorage.setItem(SESSION_LOGIN_KEY, account.username)
      }

      setCurrentUser(toAuthUser(account))
      return { success: true }
    },
    logout: () => {
      window.localStorage.removeItem(LOCAL_LOGIN_KEY)
      window.sessionStorage.removeItem(SESSION_LOGIN_KEY)
      setCurrentUser(null)
    },
  }), [currentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
