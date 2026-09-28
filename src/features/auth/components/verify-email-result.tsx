import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { verifyEmail } from '../functions'

export function VerifyEmailResult({
  userId,
  secret,
}: {
  userId?: string
  secret?: string
}) {
  const verifyEmailFn = useServerFn(verifyEmail)
  const [message, setMessage] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleVerification() {
    if (!userId || !secret) {
      setMessage('Ce lien de vérification est incomplet ou invalide.')
      return
    }

    setPending(true)
    setMessage(null)
    try {
      const result = await verifyEmailFn({ data: { userId, secret } })
      if (result.ok) {
        setVerified(true)
        setMessage('Votre adresse email est maintenant vérifiée.')
      } else setMessage(result.message)
    } catch {
      setMessage('Ce lien est invalide ou expiré. Demandez-en un nouveau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Vérification de votre email</CardTitle>
        <CardDescription>
          {message ?? 'Confirmez la vérification de votre adresse email.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verified ? (
          <Button render={<Link to="/compte" />}>Accéder à mon compte</Button>
        ) : (
          <Button type="button" onClick={handleVerification} disabled={pending}>
            {pending ? 'Vérification en cours…' : 'Vérifier mon adresse email'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
