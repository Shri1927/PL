import type { HTMLAttributes } from 'react'

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr {...props} className={['border-0 border-t ui-hairline', className].filter(Boolean).join(' ')} />
}

export function MStripeDivider({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['h-1 w-full ui-m-stripe', className].filter(Boolean).join(' ')} />
}

