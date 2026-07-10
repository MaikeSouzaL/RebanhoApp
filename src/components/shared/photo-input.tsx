import { useRef, useState } from 'react'
import { Camera, Trash2, ZoomIn } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

/** Redimensiona a imagem (canvas) e devolve um data URL JPEG leve. */
function resizeImage(file: File, maxSize = 1100, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('sem canvas'))
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function PhotoInput({
  value,
  onChange,
}: {
  value?: string
  onChange: (url: string | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      onChange(await resizeImage(file))
    } catch {
      /* ignora */
    }
    e.target.value = ''
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <img src={value} alt="Comprovante" className="max-h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => setView(true)}
            className="glass absolute bottom-2 left-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
          >
            <ZoomIn className="size-3.5" /> Ver
          </button>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="glass absolute bottom-2 right-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-destructive"
          >
            <Trash2 className="size-3.5" /> Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-4 text-sm font-semibold text-muted-foreground active:scale-[0.99]"
        >
          <Camera className="size-5 text-primary" />
          Anexar foto do comprovante
        </button>
      )}

      <Dialog open={view} onOpenChange={setView}>
        <DialogContent className="max-w-lg p-2">
          {value && <img src={value} alt="Comprovante" className="max-h-[75vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
