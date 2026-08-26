import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
  subscribeUnauthorized,
} from '../../../shared/auth/authTokenStorage'
import { isAbortError } from '../../../shared/api/apiClient'
import { getMe, login as loginRequest, signup, updateMe } from '../api/authApi'
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
    const token = getAuthToken()
    if (!token) {
      setIsAuthLoading(false)
      return
    }

    const controller = new AbortController()
    getMe(controller.signal)
      .then(setCurrentUser)
      .catch((error) => {
        if (!isAbortError(error)) {
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
    updateProfile: async (input) => {
      const user = await updateMe(input)
      setCurrentUser(user)
      return user
    },
    logout: clearAuthentication,
  }), [clearAuthentication, currentUser, isAuthLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
