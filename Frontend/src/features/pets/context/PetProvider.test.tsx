import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/context/AuthContext'
import { usePets } from '../hooks/usePets'
import { PetProvider } from './PetProvider'

const apiMocks = vi.hoisted(() => ({ getPets: vi.fn(), createPet: vi.fn(), updatePet: vi.fn(), deletePet: vi.fn() }))
vi.mock('../api/petApi', () => ({
  getPets: apiMocks.getPets, createPet: apiMocks.createPet, updatePet: apiMocks.updatePet, deletePet: apiMocks.deletePet,
}))

const user = { userId: 1, name: '보호자', username: 'guardian', email: 'user@example.com', phone: '', role: 'USER' as const }
const pet = { id: 1, name: '초코', species: 'DOG' as const, breed: '푸들', birthDate: '2023-01-01', sex: 'MALE' as const, weight: 5, neutered: true, medicalHistory: '', accent: 'sage' as const }

function Probe() {
  const { pets } = usePets()
  return <span>pets:{pets.length}</span>
}

function Harness() {
  const [currentUser, setCurrentUser] = useState<AuthContextValue['currentUser']>(user)
  const value: AuthContextValue = {
    currentUser, isAuthLoading: false, register: vi.fn(), login: vi.fn(), logout: () => setCurrentUser(null),
  }
  return <AuthContext.Provider value={value}><PetProvider><Probe /><button onClick={() => setCurrentUser(null)}>logout</button></PetProvider></AuthContext.Provider>
}

describe('PetProvider 인증 연동', () => {
  beforeEach(() => apiMocks.getPets.mockReset())

  it('로그인 후 pet을 조회하고 logout 시 이전 사용자 pet 상태를 제거한다', async () => {
    apiMocks.getPets.mockResolvedValue([pet])
    render(<Harness />)
    expect(await screen.findByText('pets:1')).toBeInTheDocument()
    screen.getByText('logout').click()
    await waitFor(() => expect(screen.getByText('pets:0')).toBeInTheDocument())
    expect(apiMocks.getPets).toHaveBeenCalledOnce()
  })
})
