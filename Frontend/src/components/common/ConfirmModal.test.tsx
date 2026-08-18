import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal', () => {
  it('열릴 때 취소 버튼으로 포커스를 이동하고 Escape로 닫는다', async () => {
    const user = userEvent.setup()
    const handleCancel = vi.fn()

    render(
      <ConfirmModal
        title="반려동물을 삭제할까요?"
        description="삭제 후에는 복구할 수 없습니다."
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />,
    )

    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus()
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('반려동물을 삭제할까요?')

    await user.keyboard('{Escape}')
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('마지막 버튼에서 Tab을 누르면 모달 내부 첫 버튼으로 순환한다', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmModal
        title="반려동물을 삭제할까요?"
        description="삭제 후에는 복구할 수 없습니다."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    const confirmButton = screen.getByRole('button', { name: '확인' })
    const closeButton = screen.getByRole('button', { name: '삭제 확인창 닫기' })
    confirmButton.focus()
    await user.tab()

    expect(closeButton).toHaveFocus()
  })
})
