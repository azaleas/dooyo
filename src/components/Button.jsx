import { memo } from 'react'

export const Button = memo(({ children, testId, onClick }) => {
  return (
    <button onClick={onClick} data-testid={testId}>
      {children}
    </button>
  )
})

Button.displayName = 'Button'
