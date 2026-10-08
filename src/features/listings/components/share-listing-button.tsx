import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type ShareStatus = 'idle' | 'copied' | 'failed'

export function ShareListingButton({ title }: { title: string }) {
  const [status, setStatus] = useState<ShareStatus>('idle')

  async function share(): Promise<void> {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      window.setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Button variant="outline" onClick={() => void share()}>
        {status === 'copied' ? (
          <Check aria-hidden="true" />
        ) : (
          <Share2 aria-hidden="true" />
        )}
        Partager
      </Button>
      <span aria-live="polite" className="text-sm text-muted-foreground">
        {status === 'copied' && 'Lien copié'}
        {status === 'failed' &&
          'Copie impossible : copiez l’adresse de la page.'}
      </span>
    </div>
  )
}
