const TOKEN_KEY = 'petpulse-access-token'
const LEGACY_AUTH_KEYS = [
  'petpulse-demo-accounts',
  'petpulse-demo-login',
  'petpulse-demo-session-login',
]

type UnauthorizedListener = () => void
const unauthorizedListeners = new Set<UnauthorizedListener>()

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY)
    ?? window.sessionStorage.getItem(TOKEN_KEY)
}

export function saveAuthToken(token: string, remember: boolean) {
  clearAuthToken()
  const storage = remember ? window.localStorage : window.sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
}

export function clearLegacyDemoAuth() {
  LEGACY_AUTH_KEYS.forEach((key) => {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  })
}

export function subscribeUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

export function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener())
}
