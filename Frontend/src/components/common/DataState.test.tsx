import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataState } from './DataState'

describe('DataState', () => {
  it('로딩 상태를 보조 기술에 알리고 동작 버튼을 잠시 숨긴다', () => {
    render(
      <DataState title="정보를 불러오는 중입니다." isLoading action={<button type="button">다시 시도</button>} />,
    )

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('정보를 불러오는 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
  })

  it('오류 상태를 alert 역할로 표시한다', () => {
    render(<DataState title="불러오지 못했습니다." tone="error">서버 상태를 확인해 주세요.</DataState>)

    expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다.')
    expect(screen.getByRole('alert')).toHaveTextContent('서버 상태를 확인해 주세요.')
  })
})
