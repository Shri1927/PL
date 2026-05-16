import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'outline'
type ButtonSize = 'md' | 'sm'

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
  }
>

const base =
  'inline-flex items-center justify-center gap-2 select-none border border-white text-white ui-button-uppercase transition-colors disabled:opacity-50 disabled:pointer-events-none'

const sizes: Record<ButtonSize, string> = {
  md: 'h-12 px-8 text-sm',
  sm: 'h-10 px-5 text-xs',
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-black hover:bg-white hover:text-black',
  outline: 'bg-transparent hover:bg-white hover:text-black',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[base, sizes[size], variants[variant], className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}

