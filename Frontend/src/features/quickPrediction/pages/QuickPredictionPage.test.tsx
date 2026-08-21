import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuickPredictionPage } from './QuickPredictionPage'

describe('QuickPredictionPage 수치 입력', () => {
  it('슬라이더를 변경하면 숫자 입력창 값도 변경한다', () => {
    render(<QuickPredictionPage />)

    fireEvent.change(screen.getByRole('slider', { name: '나이 슬라이더' }), {
      target: { value: '12' },
    })

    expect(screen.getByRole('spinbutton', { name: '나이 직접 입력' })).toHaveValue(12)
  })

  it('숫자 입력창을 변경하면 슬라이더 값도 변경한다', () => {
    render(<QuickPredictionPage />)

    fireEvent.change(screen.getByRole('spinbutton', { name: '체온 직접 입력' }), {
      target: { value: '39.4' },
    })

    expect(screen.getByRole('slider', { name: '체온 슬라이더' })).toHaveValue('39.4')
  })

  it('입력 범위를 벗어난 숫자는 최대값으로 보정한다', () => {
    render(<QuickPredictionPage />)

    fireEvent.change(screen.getByRole('spinbutton', { name: '심박수 직접 입력' }), {
      target: { value: '350' },
    })

    expect(screen.getByRole('spinbutton', { name: '심박수 직접 입력' })).toHaveValue(300)
    expect(screen.getByRole('slider', { name: '심박수 슬라이더' })).toHaveValue('300')
  })
})
