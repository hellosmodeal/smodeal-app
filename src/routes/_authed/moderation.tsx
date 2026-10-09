import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useId, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  getOpenReports,
  removeListingByReport,
  suspendSellerByReport,
} from '@/features/moderation/functions'
import {
  type ModerationActionResult,
  type ModerationDecision,
  moderationDecisionMessage,
  type OpenReport,
  reportedListingStatusLabel,
  suspensionDescription,
} from '@/features/moderation/rules'

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
  // Kept at page level: the handled report leaves the list once it refreshes.
  const [status, setStatus] = useState('')
  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">
        Signalements à traiter
      </h1>
      {status && (
        <Alert role="status">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {!reports.length && (
        <div className="rounded-xl border border-border border-dashed p-8 text-center bg-card">
          <p className="font-medium">Aucun signalement en attente.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tout est traité pour le moment. Les nouveaux signalements
            apparaîtront ici.
          </p>
        </div>
      )}
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onDecided={(decision) =>
            setStatus(moderationDecisionMessage(decision))
          }
        />
      ))}
      {hasMore && (
        <Link
          to="/moderation"
          search={{ after: reports.at(-1)?.id }}
          className={buttonVariants({ variant: 'outline' })}
        >
          Signalements suivants
        </Link>
      )}
    </section>
  )
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
})

const MIN_REASON = 10

function ReportCard({
  report,
  onDecided,
}: {
  report: OpenReport
  onDecided: (decision: ModerationDecision) => void
}) {
  const router = useRouter()
  const reasonId = useId()
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState<ModerationDecision | null>(null)
  const [error, setError] = useState('')
  const reasonReady = reason.trim().length >= MIN_REASON
  const listingTitle = report.listing?.title ?? 'Annonce supprimée'

  async function decide(decision: ModerationDecision) {
    if (!reasonReady) {
      setError(
        `Précisez le motif de la décision en au moins ${MIN_REASON} caractères.`,
      )
      return
    }
    setPending(decision)
    setError('')
    try {
      const result: ModerationActionResult =
        decision === 'suspend'
          ? await suspendSellerByReport({
              data: { reportId: report.id, reason },
            })
          : await removeListingByReport({
              data: { reportId: report.id, reason, action: decision },
            })
      if (!result.ok) {
        setError(result.message)
        if (result.code === 'already_handled') await router.invalidate()
        return
      }
      onDecided(decision)
      await router.invalidate()
    } catch {
      setError(
        'Action impossible. Rechargez pour vérifier l’état du signalement.',
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <article className="space-y-4 rounded-xl border border-border p-5 bg-card">
      <header className="space-y-1">
        <div className="flex gap-2 flex-wrap items-center">
          <h2 className="font-heading text-lg font-semibold">{listingTitle}</h2>
          {!report.listing?.publiclyVisible && (
            <Badge variant="outline">
              {reportedListingStatusLabel(report.listing)}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Signalé le{' '}
          <time dateTime={report.createdAt}>
            {dateFormatter.format(new Date(report.createdAt))}
          </time>
        </p>
        {report.listing?.publiclyVisible && (
          <Link
            to="/annonces/$listingId"
            params={{ listingId: report.listingId }}
            className="text-sm font-medium underline text-primary"
          >
            Voir l’annonce
          </Link>
        )}
      </header>
      <div>
        <p className="text-sm font-medium">Motif du signalement</p>
        <p className="whitespace-pre-wrap">{report.reason}</p>
      </div>
      <Field>
        <FieldLabel htmlFor={reasonId}>Motif de la décision</FieldLabel>
        <Textarea
          id={reasonId}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          minLength={MIN_REASON}
          maxLength={500}
          rows={2}
        />
        <FieldDescription>
          Enregistré dans le journal de modération ({MIN_REASON} caractères
          minimum).
        </FieldDescription>
      </Field>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => decide('dismiss')}
        >
          {pending === 'dismiss' ? 'Classement…' : 'Classer sans retrait'}
        </Button>
        <ConfirmDecision
          triggerLabel="Retirer l’annonce"
          pendingLabel="Retrait…"
          title="Retirer cette annonce ?"
          description={`« ${listingTitle} » ne sera plus visible et le signalement sera clôturé.`}
          confirmLabel="Retirer l’annonce"
          variant="destructive"
          pending={pending === 'remove'}
          disabled={pending !== null}
          canOpen={reasonReady}
          onBlocked={() => decide('remove')}
          onConfirm={() => decide('remove')}
        />
        <ConfirmDecision
          triggerLabel="Suspendre le vendeur"
          pendingLabel="Suspension…"
          title="Suspendre ce vendeur ?"
          description={suspensionDescription(report.listing?.title)}
          confirmLabel="Suspendre le vendeur"
          variant="solid-destructive"
          pending={pending === 'suspend'}
          disabled={pending !== null}
          canOpen={reasonReady}
          onBlocked={() => decide('suspend')}
          onConfirm={() => decide('suspend')}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </article>
  )
}

const SOLID_DESTRUCTIVE =
  'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40'

function ConfirmDecision({
  triggerLabel,
  pendingLabel,
  title,
  description,
  confirmLabel,
  variant,
  pending,
  disabled,
  canOpen,
  onBlocked,
  onConfirm,
}: {
  triggerLabel: string
  pendingLabel: string
  title: string
  description: string
  confirmLabel: string
  variant: 'destructive' | 'solid-destructive'
  pending: boolean
  disabled: boolean
  canOpen: boolean
  onBlocked: () => void
  onConfirm: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const buttonProps =
    variant === 'solid-destructive'
      ? { variant: 'destructive' as const, className: SOLID_DESTRUCTIVE }
      : { variant: 'destructive' as const }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next && !canOpen) {
          onBlocked()
          return
        }
        setOpen(next)
      }}
    >
      <AlertDialogTrigger
        render={<Button type="button" {...buttonProps} disabled={disabled} />}
      >
        {pending ? pendingLabel : triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button
            type="button"
            {...buttonProps}
            onClick={async () => {
              setOpen(false)
              await onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
