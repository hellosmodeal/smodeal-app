import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { verifyEmail } from '../functions'
import { AuthCard } from './auth-card'
import { InvalidLinkNotice } from './invalid-link'

export function VerifyEmailResult({
  userId,
  secret,
}: {
  userId?: string
  secret?: string
}) {
  const verifyEmailFn = useServerFn(verifyEmail)
  const [failure, setFailure] = useState<string | null>(
    userId && secret
      ? null
      : 'Ce lien de vérification est incomplet ou invalide.',
  )
  const [verified, setVerified] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleVerification() {
    if (!userId || !secret) return
    setPending(true)
    setFailure(null)
    try {
      const result = await verifyEmailFn({ data: { userId, secret } })
      if (result.ok) setVerified(true)
      else setFailure(result.message)
    } catch {
      setFailure('Ce lien est invalide ou expiré. Demandez-en un nouveau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Vérification de votre email"
      description={
        verified
          ? 'Votre adresse email est maintenant vérifiée.'
          : 'Confirmez la vérification de votre adresse email.'
      }
    >
      {failure ? (
        <InvalidLinkNotice message={failure} action="account" />
      ) : verified ? (
        <Link to="/compte" className={buttonVariants()}>
          Accéder à mon compte
        </Link>
      ) : (
        <Button type="button" onClick={handleVerification} disabled={pending}>
          {pending ? 'Vérification en cours…' : 'Vérifier mon adresse email'}
        </Button>
      )}
    </AuthCard>
  )
}
