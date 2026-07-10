import { cn } from '@/lib/utils'
import { CATEGORIA_MAP } from '@/data/categorias'
import type { CategoriaDespesaId } from '@/data/types'
import { Icon } from './icon'

export function CategoryIcon({
  categoria,
  className,
  size = 40,
}: {
  categoria: CategoriaDespesaId
  className?: string
  size?: number
}) {
  const meta = CATEGORIA_MAP[categoria]
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-xl', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: `color-mix(in oklab, ${meta.cor} 16%, transparent)`,
        color: meta.cor,
      }}
    >
      <Icon name={meta.icon} className="size-[45%]" />
    </div>
  )
}
