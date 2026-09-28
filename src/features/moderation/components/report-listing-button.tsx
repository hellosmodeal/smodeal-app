import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { reportListing } from '../functions'

export function ReportListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '')
    setPending(true)
    setMessage('')
    try {
      const result = await reportListing({ data: { listingId, reason } })
      setMessage(result.message)
      setSent(result.ok)
    } catch {
      setMessage('Le signalement ne peut pas être envoyé pour le moment.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Signaler cette annonce
      </Button>
      {open && !sent && (
        <form onSubmit={submit} className="space-y-3">
          <label
            htmlFor={`report-${listingId}`}
            className="block text-sm font-medium"
          >
            Motif du signalement
          </label>
          <textarea
            id={`report-${listingId}`}
            name="reason"
            required
            minLength={10}
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border border-input p-3 focus-visible:outline-2 focus-visible:outline-ring"
          />
          <Button type="submit" disabled={pending}>
            {pending ? 'Envoi…' : 'Envoyer le signalement'}
          </Button>
        </form>
      )}
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
