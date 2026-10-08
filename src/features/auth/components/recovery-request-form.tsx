import { useServerFn } from '@tanstack/react-start'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from '../functions'
import { authFieldErrors, recoveryRequestSchema } from '../rules'
import { AuthCard } from './auth-card'

type Feedback = { ok: boolean; message: string }

export function RecoveryRequestForm() {
  const requestPasswordResetFn = useServerFn(requestPasswordReset)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    const error = authFieldErrors(recoveryRequestSchema, { email }).email
    setEmailError(error)
    if (error) return

    setPending(true)
    try {
      setFeedback(await requestPasswordResetFn({ data: { email } }))
    } catch {
      setFeedback({
        ok: false,
        message: 'La demande ne peut pas être traitée pour le moment.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Indiquez votre email pour recevoir un lien de réinitialisation."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : undefined}
            required
          />
          <FieldError id="email-error">{emailError}</FieldError>
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Envoi en cours…' : 'Recevoir le lien'}
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
      </form>
    </AuthCard>
  )
}
