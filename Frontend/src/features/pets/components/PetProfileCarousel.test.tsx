import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Pet } from '../types'
import { PetProfileCarousel } from './PetProfileCarousel'

const pets: Pet[] = [
  {
    id: 1,
    name: '초코',
    species: 'DOG',
    breed: '푸들',
    birthDate: '2022-01-01',
    sex: 'MALE',
    weight: 5,
    neutered: true,
    medicalHistory: '',
    accent: 'sage',
  },
  {
    id: 2,
    name: '보리',
    species: 'CAT',
    breed: '코숏',
    birthDate: '2023-01-01',
    sex: 'FEMALE',
    weight: 4,
    neutered: true,
    medicalHistory: '',
    accent: 'sand',
  },
]

describe('PetProfileCarousel', () => {
  it('드래그하지 않은 프로필 클릭은 선택 이벤트로 전달한다', () => {
    const onSelect = vi.fn()
    render(
      <PetProfileCarousel
        pets={pets}
        selectedPet={pets[0]}
        onSelect={onSelect}
      />,
    )

    const target = screen.getByRole('button', { name: '보리 선택' })
    const viewport = target.parentElement?.parentElement as HTMLDivElement
    const setPointerCapture = vi.fn()
    Object.defineProperties(viewport, {
      setPointerCapture: { value: setPointerCapture },
      releasePointerCapture: { value: vi.fn() },
      hasPointerCapture: { value: vi.fn(() => false) },
    })

    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
    })
    fireEvent.pointerUp(target, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
    })
    fireEvent.click(target)

    expect(setPointerCapture).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('실제 드래그가 시작된 뒤에만 포인터를 캡처한다', () => {
    render(
      <PetProfileCarousel
        pets={pets}
        selectedPet={pets[0]}
        onSelect={vi.fn()}
      />,
    )

    const target = screen.getByRole('button', { name: '보리 선택' })
    const viewport = target.parentElement?.parentElement as HTMLDivElement
    const setPointerCapture = vi.fn()
    Object.defineProperties(viewport, {
      setPointerCapture: { value: setPointerCapture },
      releasePointerCapture: { value: vi.fn() },
      hasPointerCapture: { value: vi.fn(() => false) },
    })

    fireEvent.pointerDown(target, {
      pointerId: 2,
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
    })
    fireEvent.pointerMove(viewport, {
      pointerId: 2,
      pointerType: 'mouse',
      clientX: 80,
    })

    expect(setPointerCapture).toHaveBeenCalledWith(2)
  })
})
