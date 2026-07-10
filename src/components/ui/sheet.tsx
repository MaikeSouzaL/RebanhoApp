import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

type Side = 'top' | 'bottom' | 'left' | 'right'

function SheetContent({
  className,
  children,
  side = 'bottom',
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: Side; showClose?: boolean }) {
  const sideClasses: Record<Side, string> = {
    bottom:
      'inset-x-0 bottom-0 rounded-t-3xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
    top: 'inset-x-0 top-0 rounded-b-3xl border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
    left: 'inset-y-0 left-0 h-full w-4/5 max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
    right:
      'inset-y-0 right-0 h-full w-4/5 max-w-sm border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  }
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 border-border bg-card p-5 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out',
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {side === 'bottom' && (
          <div className="mx-auto -mt-1 mb-1 h-1.5 w-10 rounded-full bg-border" aria-hidden />
        )}
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 opacity-60 transition hover:opacity-100 focus:outline-none">
            <X className="size-5" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 text-left', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('font-display text-lg font-semibold', className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription }
