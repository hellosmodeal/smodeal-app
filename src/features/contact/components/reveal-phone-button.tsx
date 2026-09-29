import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { revealPhone } from '../functions'

export function RevealPhoneButton({ listingId }: { listingId: string }) {
  const reveal = useServerFn(revealPhone)
  const [phone, setPhone] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleReveal(): Promise<void> {
    setMessage(null)
    setPending(true)
    try {
      const result = await reveal({ data: { listingId } })
      if (result.ok) setPhone(result.phone)
      else setMessage(result.message)
    } catch {
      setMessage(
        'Demande impossible pour le moment. Attendez quelques instants avant de réessayer.',
      )
    } finally {
      setPending(false)
    }
  }

  if (phone) {
    return (
      <p className="rounded-lg border border-brand py-3 px-4 font-semibold bg-brand-surface text-brand-dark">
        {phone}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Button disabled={pending} onClick={() => void handleReveal()}>
        {pending ? 'Chargement…' : 'Voir le numéro de téléphone'}
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
