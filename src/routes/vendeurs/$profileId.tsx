import { createFileRoute, notFound } from '@tanstack/react-router'
import { MemberAvatar } from '@/features/navigation/components/user-menu'
import { ListingCard } from '@/features/search/components/listing-card'
import { findSellerProfile } from '@/features/sellers/functions'
import {
  describeSellerListings,
  formatMemberSince,
} from '@/features/sellers/rules'
import { getSeoConfig } from '@/features/seo/functions'
import { buildPageHead } from '@/features/seo/rules'

export const Route = createFileRoute('/vendeurs/$profileId')({
  loader: async ({ params }) => {
    const [seller, seo] = await Promise.all([
      findSellerProfile({ data: { profileId: params.profileId } }),
      getSeoConfig(),
    ])
    if (!seller) throw notFound()
    return { seller, seo, generatedAt: new Date().toISOString() }
  },
  head: ({ loaderData, params }) => {
    const seller = loaderData?.seller
    return buildPageHead(
      {
        title: seller
          ? `Annonces de ${seller.pseudonym} — Smodeal`
          : 'Page introuvable — Smodeal',
        description: seller
          ? `${describeSellerListings(seller.total)} sur Smodeal, petites annonces entre particuliers.`
          : 'Vendeur particulier sur Smodeal.',
        path: `/vendeurs/${params.profileId}`,
        imageAlt: 'Smodeal',
        type: 'website',
        noindex: true,
      },
      loaderData?.seo,
    )
  },
  component: SellerProfile,
})

function SellerProfile() {
  const { seller, generatedAt } = Route.useLoaderData()
  const now = new Date(generatedAt)

  return (
    <div>
      <header className="flex gap-4 items-center">
        <MemberAvatar name={seller.pseudonym} />
        <div className="grid min-w-0">
          <h1 className="truncate font-heading text-3xl font-bold tracking-[-0.04em]">
            {seller.pseudonym}
          </h1>
          <p className="text-sm text-muted-foreground">
            Vendeur particulier · {formatMemberSince(seller.memberSince)}
          </p>
        </div>
      </header>
      <section aria-labelledby="annonces-vendeur" className="mt-8">
        <h2 id="annonces-vendeur" className="font-heading text-xl font-bold">
          {describeSellerListings(seller.total)}
        </h2>
        {seller.listings.length > 0 ? (
          <ul className="grid gap-y-5 gap-x-4 grid-cols-1 mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {seller.listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Ce vendeur n’a pas d’annonce en ligne pour le moment.
          </p>
        )}
      </section>
    </div>
  )
}
