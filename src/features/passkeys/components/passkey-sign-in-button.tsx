import {
  browserSupportsWebAuthn,
  startAuthentication,
} from '@simplewebauthn/browser'
import { useRouter } from '@tanstack/react-router'
import { KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { finishPasskeySignIn, startPasskeySignIn } from '../functions'

const FAILED =
  'Connexion avec la clé d’accès impossible. Réessayez ou connectez-vous avec votre email.'

export function PasskeySignInButton({ redirect }: { redirect?: string }) {
  const router = useRouter()
  const [supported, setSupported] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setSupported(browserSupportsWebAuthn()), [])

  if (!supported) return null

  async function signIn() {
    setPending(true)
    setError(null)
    try {
      const { options } = await startPasskeySignIn()
      const response = await startAuthentication({ optionsJSON: options })
      const result = await finishPasskeySignIn({
        data: { ...response, clientExtensionResults: {} },
      })
      if (!result.ok) {
        setError(result.message)
        return
      }
      await router.invalidate()
      await router.navigate({ href: redirect ?? '/compte' })
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'NotAllowedError') return
      setError(FAILED)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={signIn}
      >
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <KeyRound aria-hidden />
        )}
        Se connecter avec une clé d’accès
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
