import { useServerFn } from '@tanstack/react-start'
import { Phone } from 'lucide-react'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { revealPhone } from '../functions'
import { formatPhoneForDisplay } from '../rules'

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
      <a
        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
        className={buttonVariants({ size: 'lg', className: 'w-full' })}
      >
        <Phone aria-hidden="true" />
        Appeler le {formatPhoneForDisplay(phone)}
      </a>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
        onClick={() => void handleReveal()}
      >
        <Phone aria-hidden="true" />
        {pending ? 'Affichage du numéro…' : 'Voir le numéro de téléphone'}
      </Button>
      <p role="status" className="text-sm text-muted-foreground empty:hidden">
        {message}
      </p>
    </div>
  )
}
