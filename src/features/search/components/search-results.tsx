import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ImageOff, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatPrice,
  formatPublishedAgo,
  type SearchCriteria,
  type SearchListing,
} from '../rules'

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
          <ResultCard listing={listing} now={now} />
        </li>
      ))}
    </ul>
  )
}

function ResultCard({ listing, now }: { listing: SearchListing; now: Date }) {
  return (
    <article>
      {listing.image ? (
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="object-cover aspect-[1.65] w-full rounded-lg"
        />
      ) : (
        <div className="flex gap-2 flex-col items-center justify-center aspect-[1.65] w-full rounded-lg text-sm bg-muted text-muted-foreground">
          <ImageOff aria-hidden="true" className="size-6" />
          Pas de photo
        </div>
      )}
      <Link
        to="/annonces/$listingId"
        params={{ listingId: listing.id }}
        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <h3 className="mt-2 text-sm font-semibold">{listing.title}</h3>
        <p className="text-lg font-bold">{formatPrice(listing.priceCents)}</p>
        <p className="text-sm text-muted-foreground">
          {listing.city} ·{' '}
          <time dateTime={listing.publishedAt}>
            {formatPublishedAgo(listing.publishedAt, now)}
          </time>
        </p>
      </Link>
    </article>
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
      <Link
        to="/recherche"
        search={criteria.q ? { q: criteria.q } : {}}
        className="inline-flex rounded-lg border border-brand mt-4 py-2 px-4 text-sm font-semibold text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:bg-accent"
      >
        Effacer les filtres
      </Link>
    </div>
  )
}

const pageLinkClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

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
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
  const toPage = (target: number) => ({
    ...criteria,
    page: target === 1 ? undefined : target,
  })

  return (
    <nav aria-label="Pagination" className="flex gap-2 justify-center mt-8">
      {page > 1 && (
        <Link
          to="/recherche"
          search={toPage(page - 1)}
          className={cn(pageLinkClass, 'gap-2 border-brand text-brand-dark')}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Précédent
        </Link>
      )}
      {pages.map((target) =>
        target === page ? (
          <span
            key={target}
            aria-current="page"
            className={cn(
              pageLinkClass,
              'border-brand-dark bg-brand-dark text-white',
            )}
          >
            {target}
          </span>
        ) : (
          <Link
            key={target}
            to="/recherche"
            search={toPage(target)}
            aria-label={`Page ${target}`}
            className={cn(pageLinkClass, 'border-border hover:text-brand-dark')}
          >
            {target}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link
          to="/recherche"
          search={toPage(page + 1)}
          className={cn(pageLinkClass, 'gap-2 border-brand text-brand-dark')}
        >
          Suivant
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </nav>
  )
}
