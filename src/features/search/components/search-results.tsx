import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  buildPaginationWindow,
  clearFilters,
  hasFilters,
  type SearchCriteria,
  type SearchListing,
} from '../rules'
import { ListingCard } from './listing-card'

export function ResultsGrid({
  items,
  now,
}: {
  items: SearchListing[]
  now: Date
}) {
  return (
    <ul className="grid gap-y-5 gap-x-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} now={now} headingLevel="h2" />
        </li>
      ))}
    </ul>
  )
}

/** Dims the current results while the next search is loading. */
export function PendingResults({ children }: { children: ReactNode }) {
  const isLoading = useRouterState({ select: (state) => state.isLoading })

  return (
    <div
      aria-busy={isLoading}
      className={cn(
        'transition-opacity',
        isLoading && 'opacity-50 pointer-events-none',
      )}
    >
      {children}
    </div>
  )
}

export function EmptyResults({ criteria }: { criteria: SearchCriteria }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-12 px-6 text-center">
      <SearchX aria-hidden="true" className="size-8 mx-auto text-brand" />
      <p className="mt-3 font-semibold">
        Aucune annonce ne correspond à votre recherche
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Essayez un autre mot-clé, un autre lieu ou élargissez vos filtres.
      </p>
      <div className="flex gap-3 flex-wrap justify-center mt-4">
        {hasFilters(criteria) && (
          <Link
            activeOptions={{ exact: true }}
            to="/recherche"
            search={clearFilters(criteria)}
            className={buttonVariants({ variant: 'outline' })}
          >
            Effacer les filtres
          </Link>
        )}
        <Link
          activeOptions={{ exact: true }}
          to="/recherche"
          search={{}}
          className={buttonVariants()}
        >
          Voir toutes les annonces
        </Link>
      </div>
    </div>
  )
}

export function Pagination({
  criteria,
  page,
  pageCount,
}: {
  criteria: SearchCriteria
  page: number
  pageCount: number
}) {
  if (pageCount <= 1) return null
  const toPage = (target: number) => ({
    ...criteria,
    page: target === 1 ? undefined : target,
  })

  return (
    <nav
      aria-label="Pagination des résultats"
      className="flex gap-2 flex-wrap items-center justify-center mt-8"
    >
      {page > 1 && (
        <Link
          activeOptions={{ exact: true }}
          to="/recherche"
          search={toPage(page - 1)}
          rel="prev"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          <ArrowLeft aria-hidden="true" />
          Précédent
        </Link>
      )}
      {buildPaginationWindow(page, pageCount).map((item, index) =>
        item === 'ellipsis' ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: an ellipsis has no identity besides its position
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="px-1 text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            activeOptions={{ exact: true }}
            key={item}
            to="/recherche"
            search={toPage(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={buttonVariants({
              variant: item === page ? 'default' : 'outline',
              size: 'icon-lg',
            })}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link
          activeOptions={{ exact: true }}
          to="/recherche"
          search={toPage(page + 1)}
          rel="next"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          Suivant
          <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
