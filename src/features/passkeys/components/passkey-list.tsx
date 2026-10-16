import {
  browserSupportsWebAuthn,
  startRegistration,
} from '@simplewebauthn/browser'
import { useRouter } from '@tanstack/react-router'
import { KeyRound, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormFeedback } from '@/features/account/components/form-feedback'
import {
  deletePasskey,
  finishPasskeyRegistration,
  startPasskeyRegistration,
} from '../functions'
import type { PasskeySummary } from '../rules'

const UNAVAILABLE = 'Action impossible pour le moment. Réessayez plus tard.'

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeZone: 'Europe/Paris',
})

export function PasskeyList({ passkeys }: { passkeys: PasskeySummary[] }) {
  const router = useRouter()
  const [supported, setSupported] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => setSupported(browserSupportsWebAuthn()), [])

  async function run(key: string, action: () => Promise<string | null>) {
    setPending(key)
    setError(null)
    setSuccess(null)
    try {
      const message = await action()
      if (message) {
        await router.invalidate()
        setSuccess(message)
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'NotAllowedError') return
      setError(
        caught instanceof Error && caught.name === 'InvalidStateError'
          ? 'Cet appareil possède déjà une clé d’accès pour votre compte.'
          : UNAVAILABLE,
      )
    } finally {
      setPending(null)
    }
  }

  const add = () =>
    run('add', async () => {
      const started = await startPasskeyRegistration()
      if (!started.ok) {
        setError(started.message)
        return null
      }
      const response = await startRegistration({
        optionsJSON: started.options,
      })
      const result = await finishPasskeyRegistration({
        data: { ...response, clientExtensionResults: {} },
      })
      if (!result.ok) {
        setError(result.message)
        return null
      }
      return 'Clé d’accès ajoutée.'
    })

  const remove = (id: string) =>
    run(id, async () => {
      const result = await deletePasskey({ data: { id } })
      if (!result.ok) {
        setError(result.message)
        return null
      }
      return 'Clé d’accès supprimée.'
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-semibold">Clés d’accès</h2>
        </CardTitle>
        <CardDescription>
          Connectez-vous avec l’empreinte, le visage ou le code de votre
          appareil, sans mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {passkeys.length > 0 ? (
          <ul className="grid gap-2">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex gap-3 items-center justify-between rounded-lg border p-3"
              >
                <div className="grid gap-0.5 text-sm">
                  <span className="font-medium">
                    Ajoutée le {dateFormat.format(new Date(passkey.createdAt))}
                  </span>
                  <span className="text-muted-foreground">
                    {passkey.lastUsedAt
                      ? `Dernière utilisation le ${dateFormat.format(new Date(passkey.lastUsedAt))}`
                      : 'Jamais utilisée'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending !== null}
                  aria-label="Supprimer cette clé d’accès"
                  onClick={() => remove(passkey.id)}
                >
                  {pending === passkey.id ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Trash2 aria-hidden />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune clé d’accès enregistrée.
          </p>
        )}
        <FormFeedback error={error} success={success} />
        {supported ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending !== null}
            className="w-full sm:w-fit"
            onClick={add}
          >
            {pending === 'add' ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <KeyRound aria-hidden />
            )}
            Ajouter une clé d’accès
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ce navigateur ne prend pas en charge les clés d’accès.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
