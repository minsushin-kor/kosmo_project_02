import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  clearAuthToken,
  clearLegacyDemoAuth,
  getAuthToken,
  saveAuthToken,
  subscribeUnauthorized,
} from '../../../shared/auth/authTokenStorage'
import { getMe, login as loginRequest, signup } from '../api/authApi'
import type { AuthUser } from '../types'
import { AuthContext, type AuthContextValue } from './AuthContext'

type AuthProviderProps = { children: ReactNode }

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const clearAuthentication = useCallback(() => {
    clearAuthToken()
    setCurrentUser(null)
  }, [])

  useEffect(() => subscribeUnauthorized(clearAuthentication), [clearAuthentication])

  useEffect(() => {
    clearLegacyDemoAuth()
    const token = getAuthToken()
    if (!token) {
      setIsAuthLoading(false)
      return
    }

    const controller = new AbortController()
    getMe(controller.signal)
      .then(setCurrentUser)
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          clearAuthentication()
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsAuthLoading(false)
      })
    return () => controller.abort()
  }, [clearAuthentication])

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    isAuthLoading,
    register: signup,
    login: async (loginId, password, remember) => {
      const result = await loginRequest(loginId, password)
      saveAuthToken(result.accessToken, remember)
      setCurrentUser(result.user)
      return result.user
    },
    logout: clearAuthentication,
  }), [clearAuthentication, currentUser, isAuthLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
