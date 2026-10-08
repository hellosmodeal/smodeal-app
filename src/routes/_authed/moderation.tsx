import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getOpenReports,
  removeListingByReport,
  suspendSellerByReport,
} from '@/features/moderation/functions'
import type { OpenReport } from '@/features/moderation/rules'

export const Route = createFileRoute('/_authed/moderation')({
  validateSearch: (search: Record<string, unknown>) => ({
    after: typeof search.after === 'string' ? search.after : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (!context.user.isAdmin) throw redirect({ to: '/compte' })
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getOpenReports({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Modération — Smodeal' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ModerationPage,
})

function ModerationPage() {
  const { reports, hasMore } = Route.useLoaderData()
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Signalements à traiter</h1>
      {!reports.length && (
        <p className="text-muted-foreground">Aucun signalement en attente.</p>
      )}
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
      {hasMore && (
        <Link
          to="/moderation"
          search={{ after: reports.at(-1)?.id }}
          className="underline text-primary"
        >
          Signalements suivants
        </Link>
      )}
    </section>
  )
}

function ReportCard({ report }: { report: OpenReport }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(
      event.currentTarget,
      (event.nativeEvent as SubmitEvent).submitter,
    )
    const reason = String(form.get('reason') ?? '')
    const action = form.get('action')
    setPending(true)
    setError('')
    try {
      if (action === 'suspend')
        await suspendSellerByReport({ data: { reportId: report.id, reason } })
      else
        await removeListingByReport({
          data: {
            reportId: report.id,
            reason,
            action: action === 'dismiss' ? 'dismiss' : 'remove',
          },
        })
      await router.invalidate()
    } catch {
      setError(
        'Action impossible. Rechargez pour vérifier l’état du signalement.',
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <article className="space-y-4 rounded-xl border border-border p-5 bg-card">
      <Link
        to="/annonces/$listingId"
        params={{ listingId: report.listingId }}
        className="font-medium underline text-primary"
      >
        Voir l’annonce signalée
      </Link>
      <p className="whitespace-pre-wrap">{report.reason}</p>
      <form onSubmit={submit} className="space-y-3">
        <label
          htmlFor={`removal-${report.id}`}
          className="block text-sm font-medium"
        >
          Motif de la décision (journal de modération)
        </label>
        <textarea
          id={`removal-${report.id}`}
          name="reason"
          required
          minLength={10}
          maxLength={500}
          rows={2}
          className="w-full rounded-lg border border-input p-3 focus-visible:outline-2 focus-visible:outline-ring"
        />
        <Button
          type="submit"
          name="action"
          value="remove"
          variant="destructive"
          disabled={pending}
        >
          {pending ? 'Retrait…' : 'Retirer l’annonce et clôturer'}
        </Button>
        <Button
          type="submit"
          name="action"
          value="dismiss"
          variant="outline"
          disabled={pending}
        >
          Classer sans retrait
        </Button>
        <Button
          type="submit"
          name="action"
          value="suspend"
          variant="destructive"
          disabled={pending}
        >
          Suspendre le vendeur et retirer ses annonces
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </article>
  )
}
