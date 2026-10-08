import { Link } from '@tanstack/react-router'
import { Flag } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { reportListing } from '../functions'
import { reportSchema } from '../rules'

type Feedback = { ok: boolean; message: string }

export function ReportListingButton({
  listingId,
  signedIn,
}: {
  listingId: string
  signedIn: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const fieldId = useId()
  const hintId = useId()
  const errorId = useId()

  if (!signedIn) {
    return (
      <Link
        to="/connexion"
        search={{ redirect: `/annonces/${listingId}` }}
        className={buttonVariants({ variant: 'ghost' })}
      >
        <Flag aria-hidden="true" />
        Signaler
      </Link>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const reason = String(new FormData(form).get('reason') ?? '')
    const parsed = reportSchema.safeParse({ listingId, reason })
    setFeedback(null)
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Motif invalide.')
      form.querySelector<HTMLTextAreaElement>('textarea')?.focus()
      return
    }
    setFieldError(null)
    setPending(true)
    try {
      setFeedback(await reportListing({ data: { listingId, reason } }))
    } catch {
      setFeedback({
        ok: false,
        message: 'Le signalement ne peut pas être envoyé pour le moment.',
      })
    } finally {
      setPending(false)
    }
  }

  function cancel() {
    setOpen(false)
    setFeedback(null)
    setFieldError(null)
  }

  const sent = feedback?.ok === true

  return (
    <div className="space-y-3">
      {!sent && (
        <Button
          variant="ghost"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <Flag aria-hidden="true" />
          Signaler cette annonce
        </Button>
      )}
      {open && !sent && (
        <form onSubmit={submit} noValidate className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={fieldId}>Motif du signalement</Label>
            <Textarea
              id={fieldId}
              name="reason"
              required
              minLength={10}
              maxLength={500}
              rows={3}
              aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
              aria-invalid={fieldError ? true : undefined}
              onChange={() => setFieldError(null)}
            />
            <p id={hintId} className="text-xs text-muted-foreground">
              10 caractères minimum.
            </p>
            {fieldError && (
              <p id={errorId} className="text-sm text-destructive">
                {fieldError}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="submit" disabled={pending}>
              {pending ? 'Envoi…' : 'Envoyer le signalement'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={cancel}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
      {feedback &&
        (feedback.ok ? (
          <Alert role="status">
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        ))}
    </div>
  )
}
