import {
  ArrowLeftRight,
  Banknote,
  Building2,
  Bus,
  CalendarDays,
  CreditCard,
  Droplets,
  Globe,
  HandHeart,
  HeartHandshake,
  Music4,
  Package,
  QrCode,
  SprayCan,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Registro dos ícones lucide usados por categorias e formas de pagamento. */
export const ICONS: Record<string, LucideIcon> = {
  Building2,
  Zap,
  Droplets,
  Wifi,
  Music4,
  Wrench,
  SprayCan,
  HandHeart,
  Globe,
  HeartHandshake,
  CalendarDays,
  Bus,
  Package,
  QrCode,
  Banknote,
  CreditCard,
  ArrowLeftRight,
}

export function Icon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Cmp = ICONS[name] ?? Package
  return <Cmp className={className} />
}
