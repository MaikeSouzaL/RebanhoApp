import { cn } from '@/lib/utils'
import type * as React from 'react'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} {...props} />
}

export { Skeleton }
