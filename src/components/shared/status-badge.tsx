import { Badge } from '@/components/ui/badge'
import { CircleAlert, CircleCheck, Clock } from 'lucide-react'
import type { StatusConta } from '@/data/types'

const MAP = {
  pago: { label: 'Pago', variant: 'success' as const, Icon: CircleCheck },
  pendente: { label: 'Pendente', variant: 'warning' as const, Icon: Clock },
  atrasado: { label: 'Atrasado', variant: 'danger' as const, Icon: CircleAlert },
}

export function StatusBadge({ status }: { status: StatusConta }) {
  const { label, variant, Icon } = MAP[status]
  return (
    <Badge variant={variant}>
      <Icon />
      {label}
    </Badge>
  )
}
