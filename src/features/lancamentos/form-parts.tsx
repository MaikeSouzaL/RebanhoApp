import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FormShell({
  title,
  subtitle,
  onSubmit,
  submitLabel = 'Salvar',
  children,
}: {
  title: string
  subtitle?: string
  onSubmit: () => void
  submitLabel?: string
  children: React.ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar
      </button>
      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="space-y-4 pb-4"
      >
        {children}
        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full">
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string
  error?: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className={cn('text-xs font-medium text-destructive')}>{error}</p>}
    </div>
  )
}
