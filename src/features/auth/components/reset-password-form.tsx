import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '../functions'

export function ResetPasswordForm({
  userId,
  secret,
}: {
  userId: string
  secret: string
}) {
  const resetPasswordFn = useServerFn(resetPassword)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmation = String(formData.get('confirmation') ?? '')
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
      else setError(result.message)
    } catch {
      setError('Ce lien est invalide ou expiré. Demandez-en un nouveau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un mot de passe d’au moins 8 caractères.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {completed ? (
          <div className="space-y-4">
            <p role="status" className="text-sm text-muted-foreground">
              Votre mot de passe a été réinitialisé.
            </p>
            <Button render={<Link to="/connexion" />}>Se connecter</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
              <Input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? 'Réinitialisation en cours…'
                : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
