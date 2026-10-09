import {
  createFileRoute,
  Link,
  notFound,
  useCanGoBack,
  useRouter,
} from '@tanstack/react-router'
import { ArrowLeft, ImageOff, MapPin, Pencil, Phone } from 'lucide-react'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RevealPhoneButton } from '@/features/contact/components/reveal-phone-button'
import { ShareListingButton } from '@/features/listings/components/share-listing-button'
import { ReportListingButton } from '@/features/moderation/components/report-listing-button'
import { MemberAvatar } from '@/features/navigation/components/user-menu'
import { findPublicListing } from '@/features/search/functions'
import {
  categoryLabel,
  formatPrice,
  formatPublishedAgo,
} from '@/features/search/rules'
import { getSeoConfig } from '@/features/seo/functions'
import { buildPageHead, truncateDescription } from '@/features/seo/rules'

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
        title: listing
          ? `${listing.title} — Smodeal`
          : 'Page introuvable — Smodeal',
        description: truncateDescription(
          listing?.description ?? 'Annonce entre particuliers sur Smodeal.',
        ),
        path: listing ? `/annonces/${listing.id}` : '/annonces',
        imageAlt: listing?.title ?? 'Annonce Smodeal',
        image: listing?.photoUrls[0],
        type: listing ? 'product' : 'website',
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

function BackToResults() {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  return (
    <Link
      to="/recherche"
      onClick={(event) => {
        if (!canGoBack) return
        event.preventDefault()
        router.history.back()
      }}
      className="inline-flex gap-2 items-center text-sm font-semibold text-brand-dark hover:underline"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Retour aux annonces
    </Link>
  )
}

function ListingGallery({
  title,
  photoUrls,
}: {
  title: string
  photoUrls: string[]
}) {
  const [selected, setSelected] = useState(0)
  const main = photoUrls[selected] ?? photoUrls[0]

  if (!main) {
    return (
      <div className="flex items-center justify-center aspect-[3/2] rounded-lg bg-muted text-muted-foreground">
        <ImageOff aria-hidden="true" className="size-8" />
        <span className="ml-2 text-sm">Pas de photo</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <img
        src={main}
        alt={selected === 0 ? title : `${title}, photo ${selected + 1}`}
        width={1200}
        height={800}
        fetchPriority="high"
        className="object-cover aspect-[3/2] w-full rounded-lg bg-muted"
      />
      {photoUrls.length > 1 && (
        <ul className="grid gap-2 grid-cols-5">
          {photoUrls.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Afficher la photo ${index + 1}`}
                aria-current={index === selected}
                className="overflow-hidden block w-full rounded-md ring-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=true]:ring-2 aria-[current=true]:ring-brand"
              >
                <img
                  src={url}
                  alt=""
                  width={240}
                  height={160}
                  loading="lazy"
                  className="object-cover aspect-[3/2] w-full bg-muted"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ListingDetail() {
  const { listing, generatedAt } = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  return (
    <div>
      <BackToResults />
      <div className="grid gap-8 mt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="lg:col-start-1">
          <ListingGallery title={listing.title} photoUrls={listing.photoUrls} />
          <p className="mt-6 text-sm text-muted-foreground">
            {categoryLabel(listing.category) ?? listing.category}
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
        </div>
        <aside className="h-fit rounded-lg border border-border p-5 bg-card lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {listing.isOwner ? (
            <>
              <h2 className="font-heading text-xl font-bold">Votre annonce</h2>
              <div className="flex gap-2 flex-col mt-4">
                <Link
                  to="/annonces/$listingId/modifier"
                  params={{ listingId: listing.id }}
                  className={buttonVariants({ size: 'lg' })}
                >
                  <Pencil aria-hidden="true" />
                  Modifier l’annonce
                </Link>
                <Link
                  to="/mes-annonces"
                  className={buttonVariants({ variant: 'outline', size: 'lg' })}
                >
                  Gérer mes annonces
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-heading text-xl font-bold">
                Contacter le vendeur
              </h2>
              <div className="flex gap-3 items-center mt-4">
                <MemberAvatar name={listing.sellerPseudonym ?? 'Particulier'} />
                <div className="grid min-w-0">
                  <span className="truncate font-medium">
                    {listing.sellerPseudonym ?? 'Un particulier'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vendeur particulier
                  </span>
                </div>
              </div>
              <div className="mt-4">
                {!listing.contactAvailable ? (
                  <p className="text-sm text-muted-foreground">
                    Ce vendeur n’a pas partagé de moyen de contact.
                  </p>
                ) : user ? (
                  <RevealPhoneButton listingId={listing.id} />
                ) : (
                  <Link
                    to="/connexion"
                    search={{ redirect: `/annonces/${listing.id}` }}
                    className={buttonVariants({
                      size: 'lg',
                      className: 'w-full',
                    })}
                  >
                    <Phone aria-hidden="true" />
                    Se connecter pour contacter
                  </Link>
                )}
              </div>
            </>
          )}
          <Separator className="my-4" />
          <div className="space-y-2">
            <ShareListingButton title={listing.title} />
            {!listing.isOwner && (
              <ReportListingButton listingId={listing.id} signedIn={!!user} />
            )}
          </div>
        </aside>
        <section className="lg:col-start-1">
          <h2 className="font-heading text-xl font-bold">Description</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7">
            {listing.description}
          </p>
        </section>
      </div>
    </div>
  )
}
