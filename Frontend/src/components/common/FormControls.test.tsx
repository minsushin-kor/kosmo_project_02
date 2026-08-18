import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingButton } from './LoadingButton'
import { TextField } from './TextField'

describe('LoadingButton', () => {
  it('처리 중에는 버튼을 비활성화하고 상태와 문구를 알린다', () => {
    render(<LoadingButton isLoading loadingText="저장 중...">저장</LoadingButton>)

    const button = screen.getByRole('button', { name: '저장 중...' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('TextField', () => {
  it('라벨과 안내 문구를 입력 요소에 연결한다', () => {
    render(<TextField label="이름" name="name" required hint="20자 이내로 입력해 주세요." />)

    const input = screen.getByRole('textbox', { name: '이름' })
    expect(input).toBeRequired()
    expect(input).toHaveAccessibleDescription('20자 이내로 입력해 주세요.')
  })

  it('오류가 있으면 입력 상태와 오류 메시지를 함께 제공한다', () => {
    render(<TextField label="이메일" type="email" error="이메일 형식을 확인해 주세요." />)

    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식을 확인해 주세요.')
  })
})
