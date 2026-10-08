import { createFileRoute, Link } from '@tanstack/react-router'
import { Armchair, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CategoryTabs } from '@/features/search/components/category-tabs'
import { ListingCard } from '@/features/search/components/listing-card'
import { SearchBar } from '@/features/search/components/search-bar'
import { findListings } from '@/features/search/functions'
import { getSeoConfig } from '@/features/seo/functions'
import { buildPageHead } from '@/features/seo/rules'

const homePage = {
  title: 'Smodeal — Les belles choses circulent',
  description:
    'Smodeal réunit les petites annonces entre particuliers près de chez vous. Découvrez des objets à transmettre et donnez une nouvelle vie aux vôtres.',
  path: '/',
  imageAlt: 'Smodeal — Les belles choses circulent',
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const [seo, results] = await Promise.all([
      getSeoConfig(),
      findListings({ data: {} }),
    ])
    return { seo, results }
  },
  head: ({ loaderData }) => buildPageHead(homePage, loaderData?.seo),
  component: Home,
})

function Home() {
  const { results } = Route.useLoaderData()
  const listings = results.items
  const now = new Date(results.generatedAt)

  return (
    <>
      <section className="bg-brand-surface">
        <div className="flex items-center justify-between max-w-7xl mx-auto p-5 sm:px-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.055em] sm:text-4xl lg:text-[2.75rem]">
              Votre prochaine trouvaille est ici.
            </h1>
            <p className="mt-1 text-lg text-muted-foreground sm:text-xl">
              Achetez et vendez entre particuliers.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="overflow-hidden relative hidden h-[70px] w-[58px] lg:block"
          >
            <img
              src="/brand/smodeal-symbol.svg"
              alt=""
              width={56}
              height={56}
              className="object-contain size-14"
            />
          </span>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SearchBar />
        <CategoryTabs />
      </div>

      <section
        id="annonces"
        aria-labelledby="listings-title"
        className="max-w-7xl mx-auto px-5 pt-5 pb-2 sm:px-8"
      >
        <div className="flex gap-3 items-center">
          <h2
            id="listings-title"
            className="font-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl"
          >
            Les dernières annonces
          </h2>
          <span className="text-xs text-muted-foreground">
            {results.total} annonce{results.total > 1 ? 's' : ''}
          </span>
        </div>
        {listings.length > 0 ? (
          <ul className="grid gap-y-3 gap-x-4 grid-cols-1 mt-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 px-6 text-center">
            <Armchair
              aria-hidden="true"
              className="size-8 mx-auto text-brand"
            />
            <p className="mt-3 font-semibold">
              Aucune annonce disponible pour le moment
            </p>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link
            to="/recherche"
            className={buttonVariants({
              variant: 'outline',
              className: 'font-semibold',
            })}
          >
            Voir toutes les annonces
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-5 sm:px-8">
        <div className="flex gap-4 flex-col rounded-lg py-4 px-6 bg-foreground text-background sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-[-0.04em]">
            Un objet en moins, une bonne affaire en plus.
          </h2>
          <Link
            to="/inscription"
            className={buttonVariants({
              size: 'lg',
              className: 'text-sm font-semibold',
            })}
          >
            Créer un compte pour vendre
          </Link>
        </div>
      </section>
    </>
  )
}
