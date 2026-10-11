import { Link } from '@tanstack/react-router'
import { ImageOff } from 'lucide-react'
import {
  formatDistance,
  formatPrice,
  formatPublishedAgo,
  type SearchListing,
} from '../rules'

export function ListingCard({
  listing,
  now,
  headingLevel = 'h3',
}: {
  listing: SearchListing
  now: Date
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel

  return (
    <article>
      <Link
        to="/annonces/$listingId"
        params={{ listingId: listing.id }}
        className="block rounded-lg outline-none group focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {listing.image ? (
          <img
            src={listing.image}
            alt=""
            width={660}
            height={400}
            loading="lazy"
            decoding="async"
            className="object-cover aspect-[1.65] w-full h-auto rounded-lg bg-muted"
          />
        ) : (
          <div className="flex gap-2 flex-col items-center justify-center aspect-[1.65] w-full rounded-lg text-sm bg-muted text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-6" />
            Pas de photo
          </div>
        )}
        <Heading className="mt-2 text-sm font-semibold group-hover:underline">
          {listing.title}
        </Heading>
        <p className="text-lg font-bold">{formatPrice(listing.priceCents)}</p>
        <p className="text-sm text-muted-foreground">
          {listing.city}
          {listing.distanceKm !== undefined &&
            ` ${formatDistance(listing.distanceKm)}`}{' '}
          ·{' '}
          <time dateTime={listing.publishedAt}>
            {formatPublishedAgo(listing.publishedAt, now)}
          </time>
        </p>
      </Link>
    </article>
  )
}
