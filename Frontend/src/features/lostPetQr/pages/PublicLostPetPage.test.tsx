import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicLostPetProfile } from '../api/lostPetQrApi'
import { PublicLostPetPage } from './PublicLostPetPage'

vi.mock('../api/lostPetQrApi', () => ({
  getPublicLostPetProfile: vi.fn(),
}))

const getPublicProfileMock = vi.mocked(getPublicLostPetProfile)

describe('PublicLostPetPage', () => {
  beforeEach(() => {
    getPublicProfileMock.mockReset()
    getPublicProfileMock.mockResolvedValue({
      guardianName: '김보호',
      guardianPhone: '010-1234-5678',
      petName: '초코',
      species: 'DOG',
      breed: '푸들',
      medicalHistory: '심장약 복용 중',
    })
  })

  afterEach(() => vi.useRealTimers())

  it('로그인 없이 최소 공개 정보와 전화 버튼을 표시한다', async () => {
    render(
      <MemoryRouter initialEntries={['/lost-pet/public-token']}>
        <Routes>
          <Route path="/lost-pet/:publicToken" element={<PublicLostPetPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /초코.*발견하셨나요/ })).toBeInTheDocument()
    expect(screen.getByText('김보호')).toBeInTheDocument()
    expect(screen.getByText('강아지 · 푸들')).toBeInTheDocument()
    expect(screen.getByText('심장약 복용 중')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /보호자에게 전화하기/ }))
      .toHaveAttribute('href', 'tel:01012345678')
    expect(getPublicProfileMock).toHaveBeenCalledWith('public-token', expect.any(AbortSignal))
  })

  it('공개하지 않은 보호자 이름과 반려동물 상세정보를 표시하지 않는다', async () => {
    getPublicProfileMock.mockResolvedValue({
      guardianPhone: '010-1234-5678',
      petName: '초코',
    })

    render(
      <MemoryRouter initialEntries={['/lost-pet/public-token']}>
        <Routes>
          <Route path="/lost-pet/:publicToken" element={<PublicLostPetPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /초코.*발견하셨나요/ })).toBeInTheDocument()
    expect(screen.queryByText('보호자')).not.toBeInTheDocument()
    expect(screen.queryByText('종류·품종')).not.toBeInTheDocument()
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
  })

  it('공개 API가 응답하지 않으면 무한 로딩 대신 네트워크 안내를 표시한다', async () => {
    vi.useFakeTimers()
    getPublicProfileMock.mockImplementation((_token, signal) => new Promise((_, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))

    render(
      <MemoryRouter initialEntries={['/lost-pet/public-token']}>
        <Routes>
          <Route path="/lost-pet/:publicToken" element={<PublicLostPetPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000)
    })

    expect(screen.getByRole('heading', { name: 'QR 정보를 확인할 수 없습니다.' }))
      .toBeInTheDocument()
    expect(screen.getByText(/연결 시간이 오래 걸리고 있습니다/)).toBeInTheDocument()
  })
})
