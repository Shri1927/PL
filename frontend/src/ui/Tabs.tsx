import type { ButtonHTMLAttributes } from 'react'

export function TabButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        'px-0 py-3 ui-label-uppercase text-white/70 hover:text-white transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

export function TabUnderline({ className }: { className?: string }) {
  return <div className={['h-0.5 w-full bg-white', className].filter(Boolean).join(' ')} />
}

