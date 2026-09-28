import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ImageOff, MapPin, Phone } from 'lucide-react'
import { RevealPhoneButton } from '@/features/contact/components/reveal-phone-button'
import { ReportListingButton } from '@/features/moderation/components/report-listing-button'
import { findPublicListing } from '@/features/search/functions'
import { formatPrice, formatPublishedAgo } from '@/features/search/rules'
import { getSeoConfig } from '@/features/seo/functions'
import { buildPageHead } from '@/features/seo/rules'

export const Route = createFileRoute('/annonces/$listingId')({
  loader: async ({ params }) => {
    const [listing, seo] = await Promise.all([
      findPublicListing({ data: { listingId: params.listingId } }),
      getSeoConfig(),
    ])
    if (!listing) throw notFound()
    return { listing, seo, generatedAt: new Date().toISOString() }
  },
  head: ({ loaderData }) => {
    const listing = loaderData?.listing
    return buildPageHead(
      {
        title: listing ? `${listing.title} — Smodeal` : 'Annonce — Smodeal',
        description:
          listing?.description ?? 'Annonce entre particuliers sur Smodeal.',
        path: listing ? `/annonces/${listing.id}` : '/annonces',
        imageAlt: listing?.title ?? 'Annonce Smodeal',
      },
      loaderData?.seo,
    )
  },
  component: ListingDetail,
})

const conditions = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
} as const

function ListingDetail() {
  const { listing, generatedAt } = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Link
        to="/recherche"
        className="inline-flex gap-2 items-center text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour aux annonces
      </Link>
      <div className="grid gap-8 mt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article>
          {listing.photoUrls.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {listing.photoUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={
                    index === 0
                      ? listing.title
                      : `${listing.title}, photo ${index + 1}`
                  }
                  className="object-cover aspect-[1.4] w-full rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-[1.65] rounded-lg bg-muted text-muted-foreground">
              <ImageOff aria-hidden="true" className="size-8" />
              <span className="ml-2 text-sm">Pas de photo</span>
            </div>
          )}
          <p className="mt-6 text-sm text-muted-foreground">
            {listing.category}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-[-0.04em]">
            {listing.title}
          </h1>
          <p className="mt-3 text-2xl font-bold">
            {formatPrice(listing.priceCents)}
          </p>
          <div className="flex gap-2 items-center mt-4 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="size-4" />
            {listing.city} ({listing.postalCode}) ·{' '}
            {conditions[listing.condition]}
          </div>
          <time
            className="block mt-2 text-sm text-muted-foreground"
            dateTime={listing.publishedAt}
          >
            Publiée{' '}
            {formatPublishedAgo(listing.publishedAt, new Date(generatedAt))}
          </time>
          <h2 className="mt-8 font-heading text-xl font-bold">Description</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7">
            {listing.description}
          </p>
        </article>
        <aside className="h-fit rounded-lg border border-border p-5 bg-card">
          <h2 className="font-heading text-xl font-bold">
            Contacter le vendeur
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Le numéro s’affiche seulement si le vendeur a donné son accord.
          </p>
          <div className="mt-4">
            {user ? (
              <>
                <RevealPhoneButton listingId={listing.id} />
                <div className="border-t border-border mt-5 pt-4">
                  <ReportListingButton listingId={listing.id} />
                </div>
              </>
            ) : (
              <Link
                to="/connexion"
                search={{ redirect: `/annonces/${listing.id}` }}
                className="inline-flex gap-2 items-center rounded-lg py-2.5 px-4 text-sm font-semibold bg-brand-dark text-white hover:brightness-90"
              >
                <Phone aria-hidden="true" className="size-4" />
                Se connecter pour contacter
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
