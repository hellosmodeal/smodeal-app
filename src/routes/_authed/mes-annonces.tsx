import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import { assertMutationSucceeded } from '@/features/abuse/result'
import {
  changeListingStatus,
  getSellerListings,
  renewListing,
} from '@/features/listings/functions'

export const Route = createFileRoute('/_authed/mes-annonces')({
  validateSearch: z.object({ after: z.string().min(1).optional() }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getSellerListings({ data: deps }),
  head: () => ({ meta: [{ title: 'Mes annonces — Smodeal' }] }),
  component: SellerListingsPage,
})

function SellerListingsPage() {
  const { items: listings, nextCursor } = Route.useLoaderData()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function action(id: string, kind: 'sold' | 'withdrawn' | 'renew') {
    setError(null)
    try {
      const result =
        kind === 'renew'
          ? await renewListing({ data: { id } })
          : await changeListingStatus({ data: { id, status: kind } })
      assertMutationSucceeded(result)
      await router.invalidate()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Action impossible.')
    }
  }

  return (
    <section className="max-w-3xl mx-auto py-8 px-5 sm:px-8">
      <div className="flex gap-4 items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">
          Mes annonces
        </h1>
        <Link
          to="/deposer"
          className="rounded-lg py-2 px-4 font-semibold bg-brand-dark text-white"
        >
          Déposer
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-3 mt-6">
        {listings.length === 0 ? (
          <p className="text-muted-foreground">
            Vous n’avez pas encore publié d’annonce.
          </p>
        ) : (
          listings.map((listing) => (
            <article
              key={listing.id}
              className="flex gap-4 flex-col items-start justify-between rounded-lg border border-border p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <h2 className="font-semibold wrap-break-word">
                  {listing.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {(listing.priceCents / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}{' '}
                  · {listing.city} · {listing.status}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  to="/annonces/$listingId/modifier"
                  params={{ listingId: listing.id }}
                  className="text-sm underline"
                >
                  Modifier
                </Link>
                <button
                  type="button"
                  onClick={() => action(listing.id, 'sold')}
                  disabled={listing.status !== 'active'}
                  className="text-sm underline disabled:opacity-50"
                >
                  Vendu
                </button>
                <button
                  type="button"
                  onClick={() => action(listing.id, 'withdrawn')}
                  disabled={listing.status !== 'active'}
                  className="text-sm underline disabled:opacity-50"
                >
                  Retirer
                </button>
                <button
                  type="button"
                  onClick={() => action(listing.id, 'renew')}
                  disabled={listing.status !== 'expired'}
                  className="text-sm underline disabled:opacity-50"
                >
                  Renouveler
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      {nextCursor && (
        <Link
          to="/mes-annonces"
          search={{ after: nextCursor }}
          className="inline-block mt-5 underline"
        >
          Annonces suivantes
        </Link>
      )}
    </section>
  )
}
