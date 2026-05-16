import type { InputHTMLAttributes } from 'react'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={[
        'h-12 w-full rounded-none ui-surface-card border ui-hairline px-4 text-white placeholder:text-white/40',
        'focus:outline-none focus:border-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

