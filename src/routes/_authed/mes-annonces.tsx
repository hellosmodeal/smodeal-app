import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { CircleAlert, CircleCheck, Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
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
import { assertMutationSucceeded } from '@/features/abuse/result'
import {
  changeListingStatus,
  getSellerListings,
  renewListing,
} from '@/features/listings/functions'
import {
  type ListingStatus,
  listingStatusLabel,
  sellerListingActions,
} from '@/features/listings/rules'
import { formatPrice } from '@/features/search/rules'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  after: z.string().min(1).optional(),
  trail: z
    .string()
    .regex(/^[A-Za-z0-9._-]+(,[A-Za-z0-9._-]+){0,99}$/)
    .optional(),
  publiee: z.string().min(1).optional(),
  modifiee: z.string().min(1).optional(),
})

export const Route = createFileRoute('/_authed/mes-annonces')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ after: search.after }),
  loader: ({ deps }) => getSellerListings({ data: deps }),
  head: () => ({ meta: [{ title: 'Mes annonces — Smodeal' }] }),
  component: SellerListingsPage,
})

type SellerListing = Awaited<
  ReturnType<typeof getSellerListings>
>['items'][number]
type ListingAction = 'sold' | 'withdrawn' | 'renew'
type Feedback = { ok: boolean; message: string }

const successMessages: Record<ListingAction, string> = {
  sold: 'Annonce marquée comme vendue.',
  withdrawn: 'Annonce retirée.',
  renew: 'Annonce renouvelée pour 60 jours.',
}

const statusBadgeVariants: Record<
  ListingStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  active: 'default',
  sold: 'secondary',
  expired: 'outline',
  withdrawn: 'outline',
  removed_by_moderation: 'destructive',
}

const expiryFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeZone: 'Europe/Paris',
})

function SellerListingsPage() {
  const { items: listings, nextCursor } = Route.useLoaderData()
  const { after, trail: trailParam, publiee, modifiee } = Route.useSearch()
  const trail = trailParam ? trailParam.split(',') : []
  const router = useRouter()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function act(id: string, kind: ListingAction) {
    if (pendingId) return
    setFeedback(null)
    setPendingId(id)
    try {
      const result =
        kind === 'renew'
          ? await renewListing({ data: { id } })
          : await changeListingStatus({ data: { id, status: kind } })
      assertMutationSucceeded(result)
      await router.invalidate()
      setFeedback({ ok: true, message: successMessages[kind] })
    } catch (reason) {
      setFeedback({
        ok: false,
        message:
          reason instanceof Error
            ? reason.message
            : 'Action impossible pour le moment.',
      })
    } finally {
      setPendingId(null)
    }
  }

  const edited = modifiee
    ? listings.find((listing) => listing.id === modifiee)
    : undefined

  return (
    <section className="max-w-3xl mx-auto">
      <div className="flex gap-4 items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">
          Mes annonces
        </h1>
        <Link to="/deposer" className={buttonVariants()}>
          <Plus aria-hidden />
          Déposer
        </Link>
      </div>

      <div className="grid gap-3 mt-6 empty:hidden">
        {feedback ? (
          <Alert variant={feedback.ok ? 'default' : 'destructive'}>
            {feedback.ok ? (
              <CircleCheck aria-hidden />
            ) : (
              <CircleAlert aria-hidden />
            )}
            <AlertDescription
              className={cn(feedback.ok && 'text-card-foreground')}
            >
              {feedback.message}
            </AlertDescription>
          </Alert>
        ) : publiee ? (
          <SuccessAlert title="Annonce en ligne" listingId={publiee} />
        ) : modifiee ? (
          <SuccessAlert
            title="Modifications enregistrées"
            listingId={edited?.status === 'active' ? modifiee : undefined}
          />
        ) : null}
      </div>

      {listings.length === 0 && !after ? (
        <div className="grid gap-4 justify-items-center rounded-xl border border-dashed border-border mt-6 py-12 px-6 text-center">
          <p className="text-muted-foreground">
            Vous n’avez pas encore publié d’annonce.
          </p>
          <Link to="/deposer" className={buttonVariants({ size: 'lg' })}>
            Déposer ma première annonce
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 mt-6">
          {listings.length === 0 && (
            <li className="text-muted-foreground">
              Aucune annonce sur cette page.
            </li>
          )}
          {listings.map((listing) => (
            <SellerListingItem
              key={listing.id}
              listing={listing}
              pending={pendingId === listing.id}
              locked={pendingId !== null}
              onAction={(kind) => act(listing.id, kind)}
            />
          ))}
        </ul>
      )}

      {(after || nextCursor) && (
        <nav
          aria-label="Pagination de mes annonces"
          className="flex gap-3 justify-between mt-6"
        >
          {after ? (
            <Link
              to="/mes-annonces"
              search={{
                after: trail.at(-1),
                trail:
                  trail.length > 1 ? trail.slice(0, -1).join(',') : undefined,
              }}
              className={buttonVariants({ variant: 'outline' })}
            >
              Annonces précédentes
            </Link>
          ) : (
            <span />
          )}
          {nextCursor && (
            <Link
              to="/mes-annonces"
              search={{
                after: nextCursor,
                trail: after ? [...trail, after].join(',') : undefined,
              }}
              className={buttonVariants({ variant: 'outline' })}
            >
              Annonces suivantes
            </Link>
          )}
        </nav>
      )}
    </section>
  )
}

function SuccessAlert({
  title,
  listingId,
}: {
  title: string
  listingId?: string
}) {
  return (
    <Alert>
      <CircleCheck aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      {listingId && (
        <AlertDescription>
          <Link to="/annonces/$listingId" params={{ listingId }}>
            Voir l’annonce
          </Link>
        </AlertDescription>
      )}
    </Alert>
  )
}

function SellerListingItem({
  listing,
  pending,
  locked,
  onAction,
}: {
  listing: SellerListing
  pending: boolean
  locked: boolean
  onAction: (kind: ListingAction) => void
}) {
  const actions = sellerListingActions(listing.status)
  const hasActions = Object.values(actions).some(Boolean)

  return (
    <li className="flex gap-4 flex-col items-start justify-between rounded-lg border border-border p-4 sm:flex-row sm:items-center">
      <div className="grid gap-1.5 min-w-0">
        <h2 className="font-semibold wrap-break-word">
          {listing.status === 'active' ? (
            <Link
              to="/annonces/$listingId"
              params={{ listingId: listing.id }}
              className="hover:underline"
            >
              {listing.title}
            </Link>
          ) : (
            listing.title
          )}
        </h2>
        <p className="flex gap-y-1 gap-x-2 flex-wrap items-center text-sm text-muted-foreground">
          <Badge variant={statusBadgeVariants[listing.status]}>
            {listingStatusLabel(listing.status)}
          </Badge>
          <span>{formatPrice(listing.priceCents)}</span>
          <span aria-hidden>·</span>
          <span>{listing.city}</span>
          {listing.status === 'active' && (
            <>
              <span aria-hidden>·</span>
              <span>
                Expire le {expiryFormat.format(new Date(listing.expiresAt))}
              </span>
            </>
          )}
        </p>
      </div>
      {hasActions && (
        <div className="flex gap-2 flex-wrap items-center">
          {pending && (
            <Loader2
              className="size-4 text-muted-foreground animate-spin"
              aria-label="Action en cours"
            />
          )}
          {actions.edit && (
            <Link
              to="/annonces/$listingId/modifier"
              params={{ listingId: listing.id }}
              className={buttonVariants({ size: 'sm', variant: 'outline' })}
            >
              Modifier
            </Link>
          )}
          {actions.markSold && (
            <ConfirmAction
              label="Vendu"
              title="Marquer cette annonce comme vendue ?"
              description="L’annonce ne sera plus visible et ne pourra pas être remise en ligne."
              confirmLabel="Marquer comme vendue"
              disabled={locked}
              onConfirm={() => onAction('sold')}
            />
          )}
          {actions.withdraw && (
            <ConfirmAction
              label="Retirer"
              title="Retirer cette annonce ?"
              description="L’annonce ne sera plus visible et ne pourra pas être remise en ligne."
              confirmLabel="Retirer l’annonce"
              disabled={locked}
              onConfirm={() => onAction('withdrawn')}
            />
          )}
          {actions.renew && (
            <Button
              size="sm"
              variant="outline"
              disabled={locked}
              onClick={() => onAction('renew')}
            >
              Renouveler
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  label: string
  title: string
  description: string
  confirmLabel: string
  disabled: boolean
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button size="sm" variant="outline" disabled={disabled} />}
      >
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
