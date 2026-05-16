import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export type IconButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>

export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      className={[
        'h-12 w-12 rounded-full ui-surface-card border ui-hairline text-white inline-flex items-center justify-center',
        'hover:border-white transition-colors disabled:opacity-50 disabled:pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}

