import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { resetPassword } from '../functions'
import { AuthCard } from './auth-card'
import { InvalidLinkNotice } from './invalid-link'

const EXPIRED_LINK = 'Ce lien est invalide ou expiré. Demandez-en un nouveau.'

export function ResetPasswordForm({
  userId,
  secret,
}: {
  userId?: string
  secret?: string
}) {
  const resetPasswordFn = useServerFn(resetPassword)
  const [error, setError] = useState<string | null>(null)
  const [invalidLink, setInvalidLink] = useState<string | null>(
    userId && secret
      ? null
      : 'Ce lien de réinitialisation est incomplet ou invalide.',
  )
  const [completed, setCompleted] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId || !secret) return
    setError(null)
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmation = String(formData.get('confirmation') ?? '')
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe doivent être identiques.')
      return
    }

    setPending(true)
    try {
      const result = await resetPasswordFn({
        data: { userId, secret, password },
      })
      if (result.ok) setCompleted(true)
      else if (result.invalidLink) setInvalidLink(result.message)
      else setError(result.message)
    } catch {
      setInvalidLink(EXPIRED_LINK)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe d’au moins 8 caractères."
    >
      {invalidLink ? (
        <InvalidLinkNotice message={invalidLink} action="new-recovery-link" />
      ) : completed ? (
        <div className="space-y-4">
          <p role="status" className="text-sm text-muted-foreground">
            Votre mot de passe a été réinitialisé.
          </p>
          <Link to="/connexion" className={buttonVariants()}>
            Se connecter
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field>
            <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={256}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmation">
              Confirmer le mot de passe
            </FieldLabel>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={256}
              required
            />
          </Field>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? 'Réinitialisation en cours…'
              : 'Réinitialiser le mot de passe'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
