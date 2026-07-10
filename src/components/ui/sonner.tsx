import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useSession } from '@/store/session'

export function Toaster(props: ToasterProps) {
  const theme = useSession((s) => s.theme)
  return (
    <Sonner
      theme={theme}
      position="top-center"
      richColors
      toastOptions={{
        style: {
          borderRadius: '0.9rem',
          fontFamily: 'var(--font-sans)',
        },
      }}
      {...props}
    />
  )
}
