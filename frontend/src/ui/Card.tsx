import type { HTMLAttributes, PropsWithChildren } from 'react'

export type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    tone?: 'card' | 'soft' | 'elevated'
    hairline?: boolean
  }
>

const tones: Record<NonNullable<CardProps['tone']>, string> = {
  card: 'ui-surface-card',
  soft: 'ui-surface-soft',
  elevated: 'ui-surface-elevated',
}

export function Card({ tone = 'card', hairline = true, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        tones[tone],
        'rounded-none',
        hairline ? 'border ui-hairline' : '',
        'p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

