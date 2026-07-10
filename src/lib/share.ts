/** Compartilha texto via Web Share API, com fallback para a área de transferência. */
export async function shareText(title: string, text: string): Promise<'shared' | 'copied' | 'error'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch {
      return 'error'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'error'
  }
}

export function whatsappUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function mailtoUrl(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
