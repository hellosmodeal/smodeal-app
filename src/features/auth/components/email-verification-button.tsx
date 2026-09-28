import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestEmailVerification } from '../functions'

export function EmailVerificationButton() {
  const requestEmailVerificationFn = useServerFn(requestEmailVerification)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    setMessage(null)
    try {
      const result = await requestEmailVerificationFn()
      setMessage(
        result.ok
          ? 'Un lien de vérification vient d’être envoyé.'
          : result.message,
      )
    } catch {
      setMessage('Envoi impossible pour le moment.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={pending}>
        {pending ? 'Envoi en cours…' : 'Renvoyer le lien de vérification'}
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
