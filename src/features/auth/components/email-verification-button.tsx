import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { requestEmailVerification } from '../functions'

type Feedback = { ok: boolean; message: string }

export function EmailVerificationButton({
  label = 'Renvoyer l’email de vérification',
  variant = 'default',
}: {
  label?: string
  variant?: 'default' | 'outline'
}) {
  const requestEmailVerificationFn = useServerFn(requestEmailVerification)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    setFeedback(null)
    try {
      const result = await requestEmailVerificationFn()
      setFeedback(
        result.ok
          ? {
              ok: true,
              message: 'Un nouveau lien de vérification vient d’être envoyé.',
            }
          : result,
      )
    } catch {
      setFeedback({ ok: false, message: 'Envoi impossible pour le moment.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        className="w-full sm:w-auto"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? 'Envoi en cours…' : label}
      </Button>
      {feedback?.ok && (
        <p role="status" className="text-sm text-muted-foreground">
          {feedback.message}
        </p>
      )}
      {feedback && !feedback.ok && (
        <Alert variant="destructive">
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
