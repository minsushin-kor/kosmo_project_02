import { beforeEach, describe, expect, it } from 'vitest'
import { clearAuthToken, getAuthToken, saveAuthToken } from './authTokenStorage'

describe('authTokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('로그인 유지 토큰은 localStorage에만 저장한다', () => {
    saveAuthToken('local-token', true)
    expect(window.localStorage.getItem('petpulse-access-token')).toBe('local-token')
    expect(window.sessionStorage.getItem('petpulse-access-token')).toBeNull()
  })

  it('세션 토큰 저장 시 기존 localStorage 토큰을 제거한다', () => {
    saveAuthToken('old-token', true)
    saveAuthToken('session-token', false)
    expect(getAuthToken()).toBe('session-token')
    expect(window.localStorage.getItem('petpulse-access-token')).toBeNull()
  })

  it('logout용 clear는 양쪽 storage 토큰을 모두 제거한다', () => {
    window.localStorage.setItem('petpulse-access-token', 'local')
    window.sessionStorage.setItem('petpulse-access-token', 'session')
    clearAuthToken()
    expect(getAuthToken()).toBeNull()
  })
})
