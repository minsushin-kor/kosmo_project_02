import type { ButtonHTMLAttributes, ReactNode } from 'react'

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
  loadingText?: ReactNode
}

export function LoadingButton({
  children,
  disabled,
  isLoading = false,
  loadingText = '처리 중...',
  ...buttonProps
}: LoadingButtonProps) {
  return (
    <button
      {...buttonProps}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? loadingText : children}
    </button>
  )
}
